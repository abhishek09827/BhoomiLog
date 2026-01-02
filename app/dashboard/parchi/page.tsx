"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, FileText, ImageIcon } from "lucide-react"
import { AddParchiModal } from "@/components/add-parchi-modal"
import { ParchiPreviewModal } from "@/components/parchi-preview-modal"

interface Parchi {
  id: string
  land_id_code: string
  season: string
  crop_name: string
  parchi_type: string
  parchi_date: string
  amount: number
  quantity_weight: number
  file_url: string
}

export default function ParchiPage() {
  const [parchis, setParchis] = useState<Parchi[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [previewParchi, setPreviewParchi] = useState<Parchi | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchParchis()
  }, [])

  const fetchParchis = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("parchis")
      .select(
        `
        id,
        season,
        crop_name,
        parchi_type,
        parchi_date,
        amount,
        quantity_weight,
        file_url,
        lands(land_id_code)
      `,
      )
      .order("parchi_date", { ascending: false })

    if (!error && data) {
      const formatted = data.map((p: any) => ({
        id: p.id,
        land_id_code: p.lands?.land_id_code || "N/A",
        season: p.season,
        crop_name: p.crop_name,
        parchi_type: p.parchi_type,
        parchi_date: p.parchi_date,
        amount: p.amount,
        quantity_weight: p.quantity_weight,
        file_url: p.file_url,
      }))
      setParchis(formatted)
    }
    setLoading(false)
  }

  const handleDeleteParchi = async (id: string) => {
    if (confirm("Are you sure you want to delete this parchi?")) {
      const supabase = createClient()
      const { error } = await supabase.from("parchis").delete().eq("id", id)
      if (!error) {
        setParchis(parchis.filter((p) => p.id !== id))
      }
    }
  }

  const getParchiTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      mandi_sale: "default",
      payment: "secondary",
      other: "outline",
    }
    return <Badge variant={variants[type] || "outline"}>{type.replace(/_/g, " ")}</Badge>
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

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parchi (Documents)</h1>
          <p className="text-muted-foreground mt-2">Upload and manage agricultural documents</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Upload Parchi
        </Button>
      </div>

      <AddParchiModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false)
          fetchParchis()
        }}
      />

      <ParchiPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        parchi={previewParchi}
        isImage={previewParchi ? isImage(previewParchi.file_url) : false}
      />

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Land</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Quantity / Weight</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : parchis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No parchis found. Upload your first parchi to get started.
                  </TableCell>
                </TableRow>
              ) : (
                parchis.map((parchi) => (
                  <TableRow key={parchi.id}>
                    <TableCell className="font-medium">{parchi.land_id_code}</TableCell>
                    <TableCell>{parchi.crop_name}</TableCell>
                    <TableCell>{getSeasonBadge(parchi.season)}</TableCell>
                    <TableCell>{getParchiTypeBadge(parchi.parchi_type)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(parchi.parchi_date).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>₹{parchi.amount?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="text-sm">{parchi.quantity_weight || "N/A"}</TableCell>
                    <TableCell>
                      {parchi.file_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewParchi(parchi)
                            setShowPreview(true)
                          }}
                          className="gap-1"
                        >
                          {isImage(parchi.file_url) ? (
                            <ImageIcon className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          View
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteParchi(parchi.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
