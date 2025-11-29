import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-600 via-purple-500 to-blue-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">新規登録</CardTitle>
          <CardDescription className="text-center">アカウントを作成してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" type="email" placeholder="example@email.com" className="w-full" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input id="password" type="password" placeholder="••••••••" className="w-full" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">パスワード（確認）</Label>
            <Input id="confirm-password" type="password" placeholder="••••••••" className="w-full" />
          </div>
          <Button className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700">
            <Link href="/profile-setup" className="w-full">
              登録する
            </Link>
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            既にアカウントをお持ちですか？{" "}
            <Link href="/" className="text-violet-600 hover:text-violet-700 font-medium hover:underline">
              ログインへ
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
