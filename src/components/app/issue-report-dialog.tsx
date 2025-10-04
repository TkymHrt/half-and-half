'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IssueRepo, LogRepo } from '@/lib/mock';
import { AlertTriangle } from 'lucide-react';

const issueSchema = z.object({
  summary: z.string().min(1, '概要は必須です'),
  detail: z.string().optional(),
  kind: z.enum(['loss', 'damage', 'other'], {
    required_error: '種別の選択は必須です',
  }),
  reporter: z.string().min(1, '報告者名は必須です'),
});

export function IssueReportDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof issueSchema>>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      summary: '',
      detail: '',
      reporter: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof issueSchema>) => {
    const newIssue = await IssueRepo.create(values);
    await LogRepo.create({
      actor: values.reporter,
      type: 'issue_reported',
      payload: {
        issueId: newIssue.id,
        summary: newIssue.summary,
      },
    });

    console.log('New issue reported:', newIssue);
    handleDialogClose();
  };

  const handleDialogClose = () => {
    form.reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <AlertTriangle className="mr-2 h-4 w-4" />
          問題報告
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>問題報告</DialogTitle>
          <DialogDescription>
            物品の紛失・破損など、問題が発生した場合に報告してください。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>概要</FormLabel>
                  <FormControl>
                    <Input placeholder="例: スピーカーの破損" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>種別</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="問題の種別を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="damage">破損</SelectItem>
                      <SelectItem value="loss">紛失</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="detail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>詳細</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="問題の詳細を具体的に記入してください。"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reporter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>報告者名</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 鈴木一郎" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">報告する</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}