"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { AddLandModal } from "@/components/add-land-modal"

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
  farmers?: {
    name: string
  } | null
}

export default function LandsPage() {
  const [lands, setLands] = useState<Land[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLand, setEditingLand] = useState<Land | null>(null)

  useEffect(() => {
    fetchLands()
  }, [])

  const fetchLands = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("lands")
      .select("*, farmers(name)")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setLands(data)
    }
    setLoading(false)
  }

  const handleDeleteLand = async (id: string) => {
    if (confirm("Are you sure you want to delete this land?")) {
      const supabase = createClient()
      const { error } = await supabase.from("lands").delete().eq("id", id)
      if (!error) {
        setLands(lands.filter((land) => land.id !== id))
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      active: "default",
      leased: "secondary",
      inactive: "destructive",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lands</h1>
          <p className="text-muted-foreground mt-2">Manage your agricultural lands</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Add Land
        </Button>
      </div>

      <AddLandModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingLand(null)
        }}
        onSuccess={() => {
          setShowModal(false)
          setEditingLand(null)
          fetchLands()
        }}
        editingLand={editingLand}
      />

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Land ID</TableHead>
                <TableHead>Village</TableHead>
                <TableHead>Khasra No</TableHead>
                <TableHead>Area (Acre / Bigha)</TableHead>
                <TableHead>Handler</TableHead>
                <TableHead>Status</TableHead>
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
              ) : lands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No lands found. Add your first land to get started.
                  </TableCell>
                </TableRow>
              ) : (
                lands.map((land) => (
                  <TableRow key={land.id}>
                    <TableCell className="font-medium">{land.land_id_code}</TableCell>
                    <TableCell>{land.village || "-"}</TableCell>
                    <TableCell>{land.khasra_no}</TableCell>
                    <TableCell className="text-sm">
                      {land.area_acres ? `${land.area_acres} Acre` : ""}
                      {land.area_bigha ? ` / ${land.area_bigha} Bigha` : ""}
                    </TableCell>
                    <TableCell className="text-sm">{land.farmers?.name || "-"}</TableCell>
                    <TableCell>{getStatusBadge(land.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingLand(land)
                            setShowModal(true)
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLand(land.id)}
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
