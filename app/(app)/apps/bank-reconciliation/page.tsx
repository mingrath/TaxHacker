import Link from "next/link"
import { Upload } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getBankStatements } from "@/models/bank-statements"
import { StatementList } from "./components/statement-list"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function BankReconciliationPage() {
  const user = await getCurrentUser()
  const statements = await getBankStatements(user.id)

  return (
    <div>
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">
          กระทบยอดธนาคาร
        </h2>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-muted-foreground">
            นำเข้ารายการจาก CSV หรือ Excel แล้วจับคู่กับรายการใน BanChee
          </p>
          <Button asChild>
            <Link href="/apps/bank-reconciliation/import">
              <Upload className="mr-2 h-4 w-4" />
              นำเข้ารายการใหม่
            </Link>
          </Button>
        </div>
      </header>

      <StatementList statements={statements} />
    </div>
  )
}
