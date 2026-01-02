"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddParchiModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [lands, setLands] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    land_id: "",
    season: "rabi",
    crop_name: "",
    parchi_type: "mandi_sale",
    parchi_date: new Date().toISOString().split("T")[0],
    amount: "",
    quantity_weight: "",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) throw new Error("Not authenticated")

      let file_url = null
      let file_path = null

      // Upload file if selected
      if (file) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        const filePath = `parchis/${fileName}`

        const { error: uploadError, data } = await supabase.storage
          .from("parchis")
          .upload(filePath, file, { upsert: false })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: publicUrl } = supabase.storage.from("parchis").getPublicUrl(filePath)
        file_url = publicUrl.publicUrl
        file_path = filePath
      }

      const { error } = await supabase.from("parchis").insert({
        user_id: authData.user.id,
        land_id: formData.land_id,
        season: formData.season,
        crop_name: formData.crop_name,
        parchi_type: formData.parchi_type,
        parchi_date: formData.parchi_date,
        amount: formData.amount ? Number.parseFloat(formData.amount) : null,
        quantity_weight: formData.quantity_weight ? Number.parseFloat(formData.quantity_weight) : null,
        file_url,
        file_path,
      })

      if (error) throw error

      onSuccess()
      setFormData({
        land_id: "",
        season: "rabi",
        crop_name: "",
        parchi_type: "mandi_sale",
        parchi_date: new Date().toISOString().split("T")[0],
        amount: "",
        quantity_weight: "",
      })
      setFile(null)
    } catch (error: any) {
      alert(error.message || "Failed to upload parchi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Parchi (Document)</DialogTitle>
          <DialogDescription>Upload agricultural documents with details</DialogDescription>
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
              <Label htmlFor="crop">Crop Name</Label>
              <Input
                id="crop"
                value={formData.crop_name}
                onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                placeholder="e.g., Wheat"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="parchi_type">Parchi Type</Label>
            <Select
              value={formData.parchi_type}
              onValueChange={(val) => setFormData({ ...formData, parchi_type: val })}
            >
              <SelectTrigger id="parchi_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mandi_sale">Mandi Sale</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.parchi_date}
                onChange={(e) => setFormData({ ...formData, parchi_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity / Weight</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={formData.quantity_weight}
              onChange={(e) => setFormData({ ...formData, quantity_weight: e.target.value })}
              placeholder="e.g., 50 kg"
            />
          </div>

          <div>
            <Label htmlFor="file">File (Image or PDF)</Label>
            <div className="mt-2">
              <label
                htmlFor="file"
                className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">{file ? file.name : "Click or drag to upload"}</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG, PDF up to 10MB</p>
                  </div>
                </div>
                <input
                  id="file"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.land_id}>
              {loading ? "Uploading..." : "Upload Parchi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
