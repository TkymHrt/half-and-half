'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AreaRepo, ItemRepo, LogRepo, TaskRepo } from '@/lib/mock';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { type Area, type Floor, type RelativeXY } from '@/types/app';
import dynamic from 'next/dynamic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// --- Zod Schemas ---
const pinSchema = z.object({
  areaId: z.string(),
  floorId: z.string(),
  source: z.object({ x: z.number(), y: z.number() }).optional(),
  target: z.object({ x: z.number(), y: z.number() }).optional(),
});

const itemSchema = z.object({
  name: z.string().min(1, '物品名は必須です'),
  quantity: z.coerce.number().int().min(1, '数量は1以上で入力してください'),
  sourceName: z.string().min(1, '借用元は必須です'),
  targetName: z.string().min(1, '移動先は必須です'),
  handler: z.string().optional(),
  pin: pinSchema.optional(),
});

const formSchema = z.object({
  title: z.string().min(1, 'タスク名は必須です'),
  description: z.string().optional(),
  handler: z.string().optional(),
  items: z.array(itemSchema).min(1, '少なくとも1つの物品を追加してください'),
});

type FormData = z.infer<typeof formSchema>;

// --- Dynamic Component Imports ---
const FloorMap = dynamic(
  () => import('@/components/app/map/floor-map').then((mod) => mod.FloorMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-muted rounded-md"><p>マップを読み込んでいます...</p></div>,
  }
);

// --- Main Dialog Component ---
export function TaskCreateDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      handler: '',
      items: [{ name: '', quantity: 1, sourceName: '', targetName: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const handleNextStep = async () => {
    const isValid = await form.trigger(
      step === 1 ? ['title', 'handler'] : ['items'],
    );
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => setStep((prev) => prev - 1);

  const onSubmit = async (values: FormData) => {
    const newTask = await TaskRepo.create({
      title: values.title,
      description: values.description,
      handler: values.handler,
    });
    const newItems = await ItemRepo.bulkCreate(
      values.items.map((item) => ({ ...item, taskId: newTask.id })),
    );
    await TaskRepo.update(newTask.id, { itemIds: newItems.map((i) => i.id) });
    await LogRepo.create({
      actor: 'システム',
      type: 'task_created',
      payload: { taskId: newTask.id, title: newTask.title, itemCount: newItems.length },
    });
    handleDialogClose();
  };

  const handleDialogClose = () => {
    form.reset({
      title: '',
      description: '',
      handler: '',
      items: [{ name: '', quantity: 1, sourceName: '', targetName: '' }],
    });
    setStep(1);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          タスク作成
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {step === 1 && 'Step 1: タスク情報入力'}
                {step === 2 && 'Step 2: 物品の追加'}
                {step === 3 && 'Step 3: ピンの配置'}
              </DialogTitle>
              <DialogDescription>
                新しいタスクと、それに関連する物品を登録します。
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {step === 1 && <Step1Content form={form} />}
              {step === 2 && <Step2Content form={form} fields={fields} append={append} remove={remove} />}
              {step === 3 && <Step3Content form={form} />}
            </div>

            <DialogFooter>
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  戻る
                </Button>
              )}
              {step < 3 && (
                <Button type="button" onClick={handleNextStep}>
                  次へ
                </Button>
              )}
              {step === 3 && <Button type="submit">作成</Button>}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Sub-components for each step ---

function Step1Content({ form }: { form: any }) {
  /* Same as before */
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>タスク名</FormLabel>
            <FormControl>
              <Input placeholder="例: ステージ設営" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>詳細</FormLabel>
            <FormControl>
              <Textarea placeholder="タスクの詳細を記入" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="handler"
        render={({ field }) => (
          <FormItem>
            <FormLabel>担当者/担当局</FormLabel>
            <FormControl>
              <Input placeholder="例: 運営局" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function Step2Content({ form, fields, append, remove }: { form: any, fields: any[], append: any, remove: any }) {
  /* Same as before */
  return (
    <div>
      <ScrollArea className="h-72 w-full pr-4">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-md border p-4 relative">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>物品名</FormLabel>
                      <FormControl>
                        <Input placeholder="例: スピーカー" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>数量</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.sourceName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>借用元</FormLabel>
                      <FormControl>
                        <Input placeholder="例: 部室棟C-101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.targetName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>移動先</FormLabel>
                      <FormControl>
                        <Input placeholder="例: 体育館ステージ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={() => append({ name: '', quantity: 1, sourceName: '', targetName: '' })}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        物品を追加
      </Button>
       <FormField
        control={form.control}
        name="items"
        render={() => (
            <FormItem>
                <FormMessage className="mt-2"/>
            </FormItem>
        )}
      />
    </div>
  );
}

function Step3Content({ form }: { form: any }) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [pinMode, setPinMode] = useState<'source' | 'target'>('source');

  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);

  const items = form.watch('items');
  const currentItem = items[currentItemIndex];

  useEffect(() => {
    AreaRepo.list().then(setAreas);
  }, []);

  const selectedArea = useMemo(() => areas.find((a) => a.id === selectedAreaId), [areas, selectedAreaId]);
  const selectedFloor = useMemo(() => selectedArea?.floors.find((f) => f.id === selectedFloorId), [selectedArea, selectedFloorId]);

  const handlePlacePin = (xy: RelativeXY) => {
    const fieldName = `items.${currentItemIndex}.pin.${pinMode}`;
    form.setValue(fieldName, xy, { shouldValidate: true });

    if (pinMode === 'source') {
      setPinMode('target');
    } else {
      if (currentItemIndex < items.length - 1) {
        setCurrentItemIndex((i) => i + 1);
        setPinMode('source');
      } else {
        // Last pin placed
      }
    }
  };

  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId);
    const newArea = areas.find((a) => a.id === areaId);
    if (newArea?.floors.length) {
      const floorId = newArea.floors[0].id;
      setSelectedFloorId(floorId);
      form.setValue(`items.${currentItemIndex}.pin.areaId`, areaId);
      form.setValue(`items.${currentItemIndex}.pin.floorId`, floorId);
    }
  };

  const handleFloorChange = (floorId: string) => {
    setSelectedFloorId(floorId);
    form.setValue(`items.${currentItemIndex}.pin.floorId`, floorId);
  }

  const pinsToDisplay = useMemo(() => {
    const pins = [];
    const sourcePin = form.watch(`items.${currentItemIndex}.pin.source`);
    const targetPin = form.watch(`items.${currentItemIndex}.pin.target`);
    if (sourcePin) pins.push({ xy: sourcePin, color: 'blue', message: '借用元' });
    if (targetPin) pins.push({ xy: targetPin, color: 'green', message: '移動先' });
    return pins;
  }, [form, currentItemIndex]);

  return (
    <div className="space-y-4">
      <div className="p-2 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm">
        <p className="font-bold">
          {currentItemIndex + 1} / {items.length}: 物品「{currentItem.name}」
        </p>
        <p>
          マップ上で「{pinMode === 'source' ? '借用元' : '移動先'}」の位置をクリックしてください。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select value={selectedAreaId ?? ''} onValueChange={handleAreaChange}>
          <SelectTrigger><SelectValue placeholder="エリアを選択" /></SelectTrigger>
          <SelectContent>{areas.map((area) => <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedFloorId ?? ''} onValueChange={handleFloorChange} disabled={!selectedArea}>
          <SelectTrigger><SelectValue placeholder="フロアを選択" /></SelectTrigger>
          <SelectContent>{selectedArea?.floors.map((floor) => <SelectItem key={floor.id} value={floor.id}>{floor.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="h-80">
        {selectedFloor ? (
          <FloorMap
            floor={selectedFloor}
            placeMode={{ enabled: true, onPlace: handlePlacePin }}
            pins={pinsToDisplay}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted rounded-md">
            <p>表示するフロアを選択してください。</p>
          </div>
        )}
      </div>
    </div>
  );
}