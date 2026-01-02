"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { AddCropModal } from "@/components/add-crop-modal"

interface Crop {
  id: string
  land_id_code: string
  season: string
  crop_name: string
  sowing_month: string
  harvest_month: string
  year: number
}

export default function CropsPage() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCrop, setEditingCrop] = useState<any>(null)

  useEffect(() => {
    fetchCrops()
  }, [])

  const fetchCrops = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("crops")
      .select(
        `
        id,
        season,
        crop_name,
        sowing_month,
        harvest_month,
        year,
        lands(land_id_code)
      `,
      )
      .order("created_at", { ascending: false })

    if (!error && data) {
      const formatted = data.map((c: any) => ({
        id: c.id,
        land_id_code: c.lands?.land_id_code || "N/A",
        season: c.season,
        crop_name: c.crop_name,
        sowing_month: c.sowing_month,
        harvest_month: c.harvest_month,
        year: c.year,
      }))
      setCrops(formatted)
    }
    setLoading(false)
  }

  const handleDeleteCrop = async (id: string) => {
    if (confirm("Are you sure you want to delete this crop record?")) {
      const supabase = createClient()
      const { error } = await supabase.from("crops").delete().eq("id", id)
      if (!error) {
        setCrops(crops.filter((c) => c.id !== id))
      }
    }
  }

  const getSeasonBadge = (season: string) => {
    const colors: Record<string, "default" | "secondary" | "outline"> = {
      rabi: "default",
      kharif: "secondary",
      zaid: "outline",
    }
    return (
      <Badge variant={colors[season] || "outline"} className="capitalize">
        {season}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Crops & Seasons</h1>
          <p className="text-muted-foreground mt-2">Track crops planted on your lands</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Add Crop
        </Button>
      </div>

      <AddCropModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingCrop(null)
        }}
        onSuccess={() => {
          setShowModal(false)
          setEditingCrop(null)
          fetchCrops()
        }}
        editingCrop={editingCrop}
      />

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Land</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Crop Name</TableHead>
                <TableHead>Sowing Month</TableHead>
                <TableHead>Harvest Month</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : crops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No crops found. Add your first crop to get started.
                  </TableCell>
                </TableRow>
              ) : (
                crops.map((crop) => (
                  <TableRow key={crop.id}>
                    <TableCell className="font-medium">{crop.land_id_code}</TableCell>
                    <TableCell>{getSeasonBadge(crop.season)}</TableCell>
                    <TableCell>{crop.crop_name}</TableCell>
                    <TableCell className="text-sm">{crop.sowing_month || "N/A"}</TableCell>
                    <TableCell className="text-sm">{crop.harvest_month || "N/A"}</TableCell>
                    <TableCell className="text-sm">{crop.year || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCrop(crop)
                            setShowModal(true)
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCrop(crop.id)}
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
