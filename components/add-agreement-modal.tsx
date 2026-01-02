"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingAgreement: any
}

export function AddAgreementModal({ isOpen, onClose, onSuccess, editingAgreement }: Props) {
  const [loading, setLoading] = useState(false)
  const [lands, setLands] = useState<any[]>([])
  const [farmers, setFarmers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    land_id: "",
    farmer_id: "",
    start_date: "",
    end_date: "",
    payment_type: "fixed",
    expected_amount: "",
    status: "active",
  })

  useEffect(() => {
    if (isOpen) {
      fetchLandsAndFarmers()
    }
  }, [isOpen])

  const fetchLandsAndFarmers = async () => {
    const supabase = createClient()
    const [{ data: landsData }, { data: farmersData }] = await Promise.all([
      supabase.from("lands").select("id, land_id_code"),
      supabase.from("farmers").select("id, name"),
    ])

    if (landsData) setLands(landsData)
    if (farmersData) setFarmers(farmersData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    try {
      if (editingAgreement) {
        const { error } = await supabase
          .from("agreements")
          .update({
            land_id: formData.land_id,
            farmer_id: formData.farmer_id,
            start_date: formData.start_date,
            end_date: formData.end_date,
            payment_type: formData.payment_type,
            expected_amount: Number.parseFloat(formData.expected_amount),
            status: formData.status,
          })
          .eq("id", editingAgreement.id)

        if (error) throw error
      } else {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError || !authData.user) throw new Error("Not authenticated")

        const { error } = await supabase.from("agreements").insert({
          user_id: authData.user.id,
          land_id: formData.land_id,
          farmer_id: formData.farmer_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          payment_type: formData.payment_type,
          expected_amount: Number.parseFloat(formData.expected_amount),
          status: formData.status,
        })

        if (error) throw error
      }

      onSuccess()
      setFormData({
        land_id: "",
        farmer_id: "",
        start_date: "",
        end_date: "",
        payment_type: "fixed",
        expected_amount: "",
        status: "active",
      })
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingAgreement ? "Edit Agreement" : "Add New Agreement"}</DialogTitle>
          <DialogDescription>
            {editingAgreement ? "Update agreement details" : "Create a new land-farmer lease agreement"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="land">Land</Label>
            <Select value={formData.land_id} onValueChange={(val) => setFormData({ ...formData, land_id: val })}>
              <SelectTrigger id="land">
                <SelectValue placeholder="Select land" />
              </SelectTrigger>
              <SelectContent>
                {lands.map((land) => (
                  <SelectItem key={land.id} value={land.id}>
                    {land.land_id_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="farmer">Farmer</Label>
            <Select value={formData.farmer_id} onValueChange={(val) => setFormData({ ...formData, farmer_id: val })}>
              <SelectTrigger id="farmer">
                <SelectValue placeholder="Select farmer" />
              </SelectTrigger>
              <SelectContent>
                {farmers.map((farmer) => (
                  <SelectItem key={farmer.id} value={farmer.id}>
                    {farmer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_type">Payment Type</Label>
              <Select
                value={formData.payment_type}
                onValueChange={(val) => setFormData({ ...formData, payment_type: val })}
              >
                <SelectTrigger id="payment_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="crop_share">Crop Share</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expected_amount">Expected Amount (₹)</Label>
              <Input
                id="expected_amount"
                type="number"
                step="0.01"
                value={formData.expected_amount}
                onChange={(e) => setFormData({ ...formData, expected_amount: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="renewal_pending">Renewal Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editingAgreement ? "Update Agreement" : "Add Agreement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
