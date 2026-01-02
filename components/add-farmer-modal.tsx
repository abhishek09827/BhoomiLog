"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface Farmer {
  id: string
  name: string
  phone: string
  village: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingFarmer: Farmer | null
}

export function AddFarmerModal({ isOpen, onClose, onSuccess, editingFarmer }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: editingFarmer?.name || "",
    phone: editingFarmer?.phone || "",
    village: editingFarmer?.village || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    try {
      if (editingFarmer) {
        const { error } = await supabase.from("farmers").update(formData).eq("id", editingFarmer.id)

        if (error) throw error
      } else {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError || !authData.user) throw new Error("Not authenticated")

        const { error } = await supabase.from("farmers").insert({
          user_id: authData.user.id,
          ...formData,
        })

        if (error) throw error
      }

      onSuccess()
      setFormData({
        name: "",
        phone: "",
        village: "",
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
          <DialogTitle>{editingFarmer ? "Edit Farmer" : "Add New Farmer"}</DialogTitle>
          <DialogDescription>
            {editingFarmer ? "Update farmer details" : "Add a new farmer who leases your lands"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Farmer's name"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>

          <div>
            <Label htmlFor="village">Village</Label>
            <Input
              id="village"
              value={formData.village}
              onChange={(e) => setFormData({ ...formData, village: e.target.value })}
              placeholder="Village name"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editingFarmer ? "Update Farmer" : "Add Farmer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
