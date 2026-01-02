"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { AddFarmerModal } from "@/components/add-farmer-modal"

interface Farmer {
  id: string
  name: string
  phone: string
  village: string
}

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null)

  useEffect(() => {
    fetchFarmers()
  }, [])

  const fetchFarmers = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("farmers").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      setFarmers(data)
    }
    setLoading(false)
  }

  const handleDeleteFarmer = async (id: string) => {
    if (confirm("Are you sure you want to delete this farmer?")) {
      const supabase = createClient()
      const { error } = await supabase.from("farmers").delete().eq("id", id)
      if (!error) {
        setFarmers(farmers.filter((farmer) => farmer.id !== id))
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Farmers / Lessees</h1>
          <p className="text-muted-foreground mt-2">Manage farmers who lease your lands</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Add Farmer
        </Button>
      </div>

      <AddFarmerModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingFarmer(null)
        }}
        onSuccess={() => {
          setShowModal(false)
          setEditingFarmer(null)
          fetchFarmers()
        }}
        editingFarmer={editingFarmer}
      />

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Village</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : farmers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No farmers found. Add your first farmer to get started.
                  </TableCell>
                </TableRow>
              ) : (
                farmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell className="font-medium">{farmer.name}</TableCell>
                    <TableCell>{farmer.phone || "N/A"}</TableCell>
                    <TableCell>{farmer.village || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingFarmer(farmer)
                            setShowModal(true)
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFarmer(farmer.id)}
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
