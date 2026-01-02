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
  editingCrop: any
}

export function AddCropModal({ isOpen, onClose, onSuccess, editingCrop }: Props) {
  const [loading, setLoading] = useState(false)
  const [lands, setLands] = useState<any[]>([])
  const [formData, setFormData] = useState({
    land_id: "",
    season: "rabi",
    crop_name: "",
    sowing_month: "",
    harvest_month: "",
    year: new Date().getFullYear(),
  })

  useEffect(() => {
    if (isOpen) {
      fetchLands()
    }
  }, [isOpen])

  const fetchLands = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("lands").select("id, land_id_code")
    if (data) setLands(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    try {
      if (editingCrop) {
        const { error } = await supabase
          .from("crops")
          .update({
            land_id: formData.land_id,
            season: formData.season,
            crop_name: formData.crop_name,
            sowing_month: formData.sowing_month,
            harvest_month: formData.harvest_month,
            year: formData.year,
          })
          .eq("id", editingCrop.id)

        if (error) throw error
      } else {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError || !authData.user) throw new Error("Not authenticated")

        const { error } = await supabase.from("crops").insert({
          user_id: authData.user.id,
          land_id: formData.land_id,
          season: formData.season,
          crop_name: formData.crop_name,
          sowing_month: formData.sowing_month,
          harvest_month: formData.harvest_month,
          year: formData.year,
        })

        if (error) throw error
      }

      onSuccess()
      setFormData({
        land_id: "",
        season: "rabi",
        crop_name: "",
        sowing_month: "",
        harvest_month: "",
        year: new Date().getFullYear(),
      })
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingCrop ? "Edit Crop" : "Add New Crop"}</DialogTitle>
          <DialogDescription>
            {editingCrop ? "Update crop details" : "Record a new crop planting for your land"}
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
            <Label htmlFor="crop_name">Crop Name</Label>
            <Input
              id="crop_name"
              value={formData.crop_name}
              onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
              placeholder="e.g., Wheat, Rice, Cotton"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="season">Season</Label>
              <Select value={formData.season} onValueChange={(val) => setFormData({ ...formData, season: val })}>
                <SelectTrigger id="season">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rabi">Rabi</SelectItem>
                  <SelectItem value="kharif">Kharif</SelectItem>
                  <SelectItem value="zaid">Zaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number.parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sowing_month">Sowing Month</Label>
              <Select
                value={formData.sowing_month}
                onValueChange={(val) => setFormData({ ...formData, sowing_month: val })}
              >
                <SelectTrigger id="sowing_month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="harvest_month">Harvest Month</Label>
              <Select
                value={formData.harvest_month}
                onValueChange={(val) => setFormData({ ...formData, harvest_month: val })}
              >
                <SelectTrigger id="harvest_month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editingCrop ? "Update Crop" : "Add Crop"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
