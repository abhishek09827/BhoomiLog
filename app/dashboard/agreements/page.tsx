"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { AddAgreementModal } from "@/components/add-agreement-modal"

interface Agreement {
  id: string
  land_id_code: string
  farmer_name: string
  start_date: string
  end_date: string
  payment_type: string
  expected_amount: number
  status: string
}

export default function AgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAgreement, setEditingAgreement] = useState<any>(null)

  useEffect(() => {
    fetchAgreements()
  }, [])

  const fetchAgreements = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("agreements")
      .select(
        `
        id,
        start_date,
        end_date,
        payment_type,
        expected_amount,
        status,
        lands(land_id_code),
        farmers(name)
      `,
      )
      .order("created_at", { ascending: false })

    if (!error && data) {
      const formatted = data.map((a: any) => ({
        id: a.id,
        land_id_code: a.lands?.land_id_code || "N/A",
        farmer_name: a.farmers?.name || "N/A",
        start_date: a.start_date,
        end_date: a.end_date,
        payment_type: a.payment_type,
        expected_amount: a.expected_amount,
        status: a.status,
      }))
      setAgreements(formatted)
    }
    setLoading(false)
  }

  const handleDeleteAgreement = async (id: string) => {
    if (confirm("Are you sure you want to delete this agreement?")) {
      const supabase = createClient()
      const { error } = await supabase.from("agreements").delete().eq("id", id)
      if (!error) {
        setAgreements(agreements.filter((a) => a.id !== id))
      }
    }
  }

  const getPaymentBadge = (type: string) => {
    return (
      <Badge variant={type === "fixed" ? "default" : "secondary"}>{type === "fixed" ? "Fixed" : "Crop Share"}</Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      active: "default",
      expired: "destructive",
      renewal_pending: "secondary",
    }
    return <Badge variant={variants[status] || "outline"}>{status.replace(/_/g, " ")}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agreements</h1>
          <p className="text-muted-foreground mt-2">Land-farmer lease agreements</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Add Agreement
        </Button>
      </div>

      <AddAgreementModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingAgreement(null)
        }}
        onSuccess={() => {
          setShowModal(false)
          setEditingAgreement(null)
          fetchAgreements()
        }}
        editingAgreement={editingAgreement}
      />

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Land</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : agreements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No agreements found. Add your first agreement to get started.
                  </TableCell>
                </TableRow>
              ) : (
                agreements.map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell className="font-medium">{agreement.land_id_code}</TableCell>
                    <TableCell>{agreement.farmer_name}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(agreement.start_date).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(agreement.end_date).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>{getPaymentBadge(agreement.payment_type)}</TableCell>
                    <TableCell>₹{agreement.expected_amount?.toLocaleString() || "0"}</TableCell>
                    <TableCell>{getStatusBadge(agreement.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingAgreement(agreement)
                            setShowModal(true)
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAgreement(agreement.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
