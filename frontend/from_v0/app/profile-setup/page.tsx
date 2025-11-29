import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProfileSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-600 via-purple-500 to-blue-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">プロフィール登録</CardTitle>
          <CardDescription className="text-center">あなたの情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">お名前</Label>
            <Input id="name" type="text" placeholder="山田 太郎" className="w-full" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">年齢</Label>
            <Input id="age" type="number" placeholder="25" className="w-full" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">性別</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">男性</SelectItem>
                <SelectItem value="female">女性</SelectItem>
                <SelectItem value="other">その他</SelectItem>
                <SelectItem value="prefer-not-to-say">回答しない</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">自己紹介</Label>
            <Textarea
              id="bio"
              placeholder="あなたについて教えてください..."
              className="w-full min-h-[100px] resize-none"
            />
          </div>
          <Button className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700">
            登録して完了
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
