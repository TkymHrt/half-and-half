"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { Task } from "@/types/app";

type TaskSelectionDialogProps = {
  isOpen: boolean;
  tasks: Task[];
  onClose: () => void;
  onSelectTask: (
    task: Task | null,
    itemData?: {
      name: string;
      quantity: number;
      sourceName: string;
      targetName: string;
    }
  ) => void;
};

export function TaskSelectionDialog({
  isOpen,
  tasks,
  onClose,
  onSelectTask,
}: TaskSelectionDialogProps) {
  const [selectedOption, setSelectedOption] = useState<"existing" | "new">(
    "existing"
  );
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  // 物品情報の状態
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [sourceName, setSourceName] = useState("");
  const [targetName, setTargetName] = useState("");

  const handleSubmit = () => {
    const itemData = {
      name: itemName,
      quantity: itemQuantity,
      sourceName,
      targetName,
    };

    if (selectedOption === "existing") {
      const selectedTask = tasks.find((task) => task.id === selectedTaskId);
      onSelectTask(selectedTask ?? null, itemData);
    } else {
      // 新しいタスクを作成
      const newTask: Task = {
        id: `new-task-${Date.now()}`,
        title: newTaskTitle,
        description: newTaskDescription,
        status: "not_started",
        itemIds: [],
        createdAt: new Date().toISOString(),
      };
      onSelectTask(newTask, itemData);
    }
  };

  const handleCancel = () => {
    setSelectedOption("existing");
    setNewTaskTitle("");
    setNewTaskDescription("");
    setSelectedTaskId("");
    setItemName("");
    setItemQuantity(1);
    setSourceName("");
    setTargetName("");
    onClose();
  };

  const isSubmitDisabled =
    (selectedOption === "existing" && !selectedTaskId) ||
    (selectedOption === "new" && !newTaskTitle.trim()) ||
    !itemName.trim() ||
    itemQuantity <= 0 ||
    !targetName.trim();

  return (
    <Dialog onOpenChange={handleCancel} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ピンと物品情報を追加</DialogTitle>
          <DialogDescription>
            新しいピンに関連付けるタスクと物品の詳細を入力してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 物品情報セクション */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium text-sm">物品情報</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="item-name">物品名 *</Label>
                <Input
                  id="item-name"
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="物品名を入力..."
                  value={itemName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">数量 *</Label>
                <Input
                  id="quantity"
                  min="1"
                  onChange={(e) =>
                    setItemQuantity(Number.parseInt(e.target.value, 10) || 1)
                  }
                  type="number"
                  value={itemQuantity}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="source-name">移動元</Label>
                <Input
                  id="source-name"
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="移動元を入力..."
                  value={sourceName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-name">移動先 *</Label>
                <Input
                  id="target-name"
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="移動先を入力..."
                  value={targetName}
                />
              </div>
            </div>
          </div>

          {/* タスク選択セクション */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">タスク選択</h3>
            <RadioGroup
              onValueChange={(value) =>
                setSelectedOption(value as "existing" | "new")
              }
              value={selectedOption}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="existing" value="existing" />
                <Label htmlFor="existing">既存のタスクを選択</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="new" value="new" />
                <Label htmlFor="new">新しいタスクを作成</Label>
              </div>
            </RadioGroup>

            {selectedOption === "existing" ? (
              <div className="space-y-2">
                <Label>タスクを選択</Label>
                <ScrollArea className="h-32">
                  <RadioGroup
                    className="space-y-2"
                    onValueChange={setSelectedTaskId}
                    value={selectedTaskId}
                  >
                    {tasks.map((task) => (
                      <div
                        className="flex items-center space-x-2 rounded-md border p-2"
                        key={task.id}
                      >
                        <RadioGroupItem id={task.id} value={task.id} />
                        <Label
                          className="flex-1 cursor-pointer"
                          htmlFor={task.id}
                        >
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-muted-foreground text-sm">
                              {task.description}
                            </div>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </ScrollArea>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">タスク名</Label>
                  <Input
                    id="title"
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="タスク名を入力..."
                    value={newTaskTitle}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">説明（任意）</Label>
                  <Textarea
                    id="description"
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="タスクの説明を入力..."
                    rows={3}
                    value={newTaskDescription}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleCancel} variant="outline">
            キャンセル
          </Button>
          <Button disabled={isSubmitDisabled} onClick={handleSubmit}>
            {selectedOption === "existing" ? (
              "選択"
            ) : (
              <>
                <Plus className="mr-2 size-4" />
                作成
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
