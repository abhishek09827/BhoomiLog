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

interface Land {
  id: string
  land_id_code: string
  village: string | null
  khasra_no: string
  area_acres: number
  area_bigha: number
  farmer_id: string | null
  details: string | null
  status: string
}

interface Farmer {
  id: string
  name: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingLand: Land | null
}

export function AddLandModal({ isOpen, onClose, onSuccess, editingLand }: Props) {
  const [loading, setLoading] = useState(false)
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [formData, setFormData] = useState({
    land_id_code: editingLand?.land_id_code || "",
    village: editingLand?.village || "",
    khasra_no: editingLand?.khasra_no || "",
    area_acres: editingLand?.area_acres || "",
    area_bigha: editingLand?.area_bigha || "",
    farmer_id: editingLand?.farmer_id || "",
    details: editingLand?.details || "",
    status: editingLand?.status || "active",
  })

  useEffect(() => {
    fetchFarmers()
  }, [])

  const fetchFarmers = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("farmers").select("id, name").order("name", { ascending: true })
    if (data) {
      setFarmers(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) throw new Error("Not authenticated")

      if (editingLand) {
        const { error } = await supabase
          .from("lands")
          .update({
            land_id_code: formData.land_id_code,
            village: formData.village || null,
            khasra_no: formData.khasra_no,
            area_acres: Number.parseFloat(String(formData.area_acres)) || null,
            area_bigha: Number.parseFloat(String(formData.area_bigha)) || null,
            farmer_id: formData.farmer_id || null,
            details: formData.details || null,
            status: formData.status,
          })
          .eq("id", editingLand.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("lands").insert({
          user_id: authData.user.id,
          land_id_code: formData.land_id_code,
          village: formData.village || null,
          khasra_no: formData.khasra_no,
          area_acres: Number.parseFloat(String(formData.area_acres)) || null,
          area_bigha: Number.parseFloat(String(formData.area_bigha)) || null,
          farmer_id: formData.farmer_id || null,
          details: formData.details || null,
          status: formData.status,
        })

        if (error) throw error
      }

      onSuccess()
      setFormData({
        land_id_code: "",
        village: "",
        khasra_no: "",
        area_acres: "",
        area_bigha: "",
        farmer_id: "",
        details: "",
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingLand ? "Edit Land" : "Add New Land"}</DialogTitle>
          <DialogDescription>
            {editingLand ? "Update land details" : "Add a new agricultural land to your records"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="land_id">Land ID *</Label>
            <Input
              id="land_id"
              value={formData.land_id_code}
              onChange={(e) => setFormData({ ...formData, land_id_code: e.target.value })}
              placeholder="e.g., LAND-001"
              required
            />
          </div>

          <div>
            <Label htmlFor="village">Village</Label>
            <Input
              id="village"
              value={formData.village}
              onChange={(e) => setFormData({ ...formData, village: e.target.value })}
              placeholder="Village name (optional)"
            />
          </div>

          <div>
            <Label htmlFor="khasra">Khasra No *</Label>
            <Input
              id="khasra"
              value={formData.khasra_no}
              onChange={(e) => setFormData({ ...formData, khasra_no: e.target.value })}
              placeholder="Khasra number"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="acres">Area (Acres)</Label>
              <Input
                id="acres"
                type="number"
                step="0.01"
                value={formData.area_acres}
                onChange={(e) => setFormData({ ...formData, area_acres: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="bigha">Area (Bigha)</Label>
              <Input
                id="bigha"
                type="number"
                step="0.01"
                value={formData.area_bigha}
                onChange={(e) => setFormData({ ...formData, area_bigha: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="farmer">Handler (Farmer/Lessee)</Label>
            <Select value={formData.farmer_id} onValueChange={(val) => setFormData({ ...formData, farmer_id: val })}>
              <SelectTrigger id="farmer">
                <SelectValue placeholder="Select a farmer..." />
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

          <div>
            <Label htmlFor="details">Additional Details</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="Add any additional notes or details about this land..."
              className="min-h-20"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="leased">Leased</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editingLand ? "Update Land" : "Add Land"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
