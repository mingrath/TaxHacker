import { getCurrentUser } from "@/lib/auth"
import { listDocumentsWithChain } from "@/models/documents"
import { DocumentTable } from "./components/document-table"

export const dynamic = "force-dynamic"

export default async function DocumentsPage() {
  const user = await getCurrentUser()
  const documents = await listDocumentsWithChain(user.id)

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">เอกสารทั้งหมด</h2>
      </header>

      <DocumentTable documents={documents} />
    </div>
  )
}
