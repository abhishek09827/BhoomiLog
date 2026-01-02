"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

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

interface Props {
  isOpen: boolean
  onClose: () => void
  parchi: Parchi | null
  isImage: boolean
}

export function ParchiPreviewModal({ isOpen, onClose, parchi, isImage }: Props) {
  if (!parchi) return null

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = parchi.file_url
    a.download = `parchi-${parchi.id}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Parchi Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Preview */}
          <div className="border border-border rounded-lg p-4 bg-muted/50 min-h-96 flex items-center justify-center">
            {isImage ? (
              <img
                src={parchi.file_url || "/placeholder.svg"}
                alt="Parchi preview"
                className="max-w-full max-h-96 object-contain rounded"
              />
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground mb-4">PDF Document</p>
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            )}
          </div>

          {/* Document Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground font-medium">Land</p>
              <p className="font-semibold">{parchi.land_id_code}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Crop</p>
              <p className="font-semibold">{parchi.crop_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Season</p>
              <p className="font-semibold capitalize">{parchi.season}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Type</p>
              <p className="font-semibold">{parchi.parchi_type.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Date</p>
              <p className="font-semibold">{new Date(parchi.parchi_date).toLocaleDateString("en-IN")}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Amount</p>
              <p className="font-semibold">₹{parchi.amount?.toLocaleString() || "N/A"}</p>
            </div>
            {parchi.quantity_weight && (
              <div>
                <p className="text-muted-foreground font-medium">Quantity / Weight</p>
                <p className="font-semibold">{parchi.quantity_weight}</p>
              </div>
            )}
          </div>

          {!isImage && (
            <Button onClick={handleDownload} className="w-full gap-2">
              <Download className="w-4 h-4" />
              Download Document
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
