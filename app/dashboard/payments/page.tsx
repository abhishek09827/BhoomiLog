"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { AddPaymentModal } from "@/components/add-payment-modal"

interface Payment {
  id: string
  land_id_code: string
  expected_amount: number
  received_amount: number
  payment_date: string
  status: string
  notes: string
  pending_amount: number
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [totalExpected, setTotalExpected] = useState(0)
  const [totalReceived, setTotalReceived] = useState(0)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        id,
        expected_amount,
        received_amount,
        payment_date,
        status,
        notes,
        agreements(
          land_id,
          lands(land_id_code)
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (!error && data) {
      const formatted = data.map((p: any) => ({
        id: p.id,
        land_id_code: p.agreements?.lands?.land_id_code || "N/A",
        expected_amount: p.expected_amount || 0,
        received_amount: p.received_amount || 0,
        payment_date: p.payment_date,
        status: p.status,
        notes: p.notes,
        pending_amount: (p.expected_amount || 0) - (p.received_amount || 0),
      }))
      setPayments(formatted)

      // Calculate totals
      const totalExp = formatted.reduce((sum, p) => sum + p.expected_amount, 0)
      const totalRec = formatted.reduce((sum, p) => sum + p.received_amount, 0)
      setTotalExpected(totalExp)
      setTotalReceived(totalRec)
    }
    setLoading(false)
  }

  const handleDeletePayment = async (id: string) => {
    if (confirm("Are you sure you want to delete this payment record?")) {
      const supabase = createClient()
      const { error } = await supabase.from("payments").delete().eq("id", id)
      if (!error) {
        setPayments(payments.filter((p) => p.id !== id))
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      paid: "default",
      partial: "secondary",
      pending: "destructive",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const getProgressPercentage = (received: number, expected: number) => {
    if (expected === 0) return 0
    return Math.min((received / expected) * 100, 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-2">Track expected vs received payments</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Expected</p>
          <p className="text-2xl font-bold text-primary">₹{totalExpected.toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Received</p>
          <p className="text-2xl font-bold text-green-600">₹{totalReceived.toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Pending</p>
          <p className="text-2xl font-bold text-orange-600">₹{(totalExpected - totalReceived).toLocaleString()}</p>
        </Card>
      </div>

      <AddPaymentModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingPayment(null)
        }}
        onSuccess={() => {
          setShowModal(false)
          setEditingPayment(null)
          fetchPayments()
        }}
        editingPayment={editingPayment}
      />

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Land</TableHead>
                <TableHead>Expected Amount</TableHead>
                <TableHead>Received Amount</TableHead>
                <TableHead>Pending Balance</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Date</TableHead>
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
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No payments found. Record your first payment to get started.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => {
                  const progress = getProgressPercentage(payment.received_amount, payment.expected_amount)
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.land_id_code}</TableCell>
                      <TableCell>₹{payment.expected_amount.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ₹{payment.received_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-orange-600 font-medium">
                        ₹{payment.pending_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="bg-muted rounded-full h-2 overflow-hidden">
                            <div className="bg-green-500 h-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 text-center">{Math.round(progress)}%</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-sm">
                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("en-IN") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPayment(payment)
                              setShowModal(true)
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
