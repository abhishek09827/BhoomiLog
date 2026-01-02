"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingPayment: any
}

export function AddPaymentModal({ isOpen, onClose, onSuccess, editingPayment }: Props) {
  const [loading, setLoading] = useState(false)
  const [agreements, setAgreements] = useState<any[]>([])
  const [formData, setFormData] = useState({
    agreement_id: "",
    expected_amount: "",
    received_amount: "",
    payment_date: "",
    status: "pending",
    notes: "",
  })

  useEffect(() => {
    if (isOpen) {
      fetchAgreements()
    }
  }, [isOpen])

  const fetchAgreements = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("agreements")
      .select(
        `
        id,
        expected_amount,
        lands(land_id_code),
        farmers(name)
      `,
      )
      .eq("status", "active")

    if (data) {
      setAgreements(
        data.map((a: any) => ({
          ...a,
          display: `${a.lands?.land_id_code} - ${a.farmers?.name}`,
        })),
      )
    }
  }

  const handleAgreementChange = (agreementId: string) => {
    const agreement = agreements.find((a) => a.id === agreementId)
    if (agreement) {
      setFormData({
        ...formData,
        agreement_id: agreementId,
        expected_amount: agreement.expected_amount?.toString() || "",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    try {
      if (editingPayment) {
        const { error } = await supabase
          .from("payments")
          .update({
            expected_amount: Number.parseFloat(formData.expected_amount),
            received_amount: Number.parseFloat(formData.received_amount),
            payment_date: formData.payment_date || null,
            status: formData.status,
            notes: formData.notes,
          })
          .eq("id", editingPayment.id)

        if (error) throw error
      } else {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError || !authData.user) throw new Error("Not authenticated")

        const { error } = await supabase.from("payments").insert({
          user_id: authData.user.id,
          agreement_id: formData.agreement_id,
          expected_amount: Number.parseFloat(formData.expected_amount),
          received_amount: Number.parseFloat(formData.received_amount),
          payment_date: formData.payment_date || null,
          status: formData.status,
          notes: formData.notes,
        })

        if (error) throw error
      }

      onSuccess()
      setFormData({
        agreement_id: "",
        expected_amount: "",
        received_amount: "",
        payment_date: "",
        status: "pending",
        notes: "",
      })
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingPayment ? "Update Payment" : "Record Payment"}</DialogTitle>
          <DialogDescription>
            {editingPayment ? "Update payment details" : "Record a new payment received from farmer"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingPayment && (
            <div>
              <Label htmlFor="agreement">Agreement</Label>
              <Select value={formData.agreement_id} onValueChange={handleAgreementChange}>
                <SelectTrigger id="agreement">
                  <SelectValue placeholder="Select agreement" />
                </SelectTrigger>
                <SelectContent>
                  {agreements.map((agreement) => (
                    <SelectItem key={agreement.id} value={agreement.id}>
                      {agreement.display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expected">Expected Amount (₹)</Label>
              <Input
                id="expected"
                type="number"
                step="0.01"
                value={formData.expected_amount}
                onChange={(e) => setFormData({ ...formData, expected_amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="received">Received Amount (₹)</Label>
              <Input
                id="received"
                type="number"
                step="0.01"
                value={formData.received_amount}
                onChange={(e) => setFormData({ ...formData, received_amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              className="min-h-20"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || (!editingPayment && !formData.agreement_id)}>
              {loading ? "Saving..." : editingPayment ? "Update Payment" : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
