"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, MapPin, FileText, TrendingUp } from "lucide-react"

interface DashboardStats {
  totalLands: number
  activeAgreements: number
  totalExpectedIncome: number
  totalReceivedIncome: number
}

interface RecentParchi {
  id: string
  land_id_code: string
  parchi_type: string
  amount: number
  parchi_date: string
}

interface UpcomingAgreement {
  id: string
  land_id_code: string
  farmer_name: string
  end_date: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLands: 0,
    activeAgreements: 0,
    totalExpectedIncome: 0,
    totalReceivedIncome: 0,
  })
  const [recentParchis, setRecentParchis] = useState<RecentParchi[]>([])
  const [upcomingAgreements, setUpcomingAgreements] = useState<UpcomingAgreement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient()

      // Fetch lands count
      const { count: landsCount } = await supabase.from("lands").select("*", { count: "exact", head: true })

      // Fetch active agreements
      const { data: agreements, count: agreementsCount } = await supabase
        .from("agreements")
        .select("id, land_id, expected_amount, status", { count: "exact" })
        .eq("status", "active")

      // Fetch total expected and received
      const { data: payments } = await supabase.from("payments").select("expected_amount, received_amount")

      let totalExpected = 0
      let totalReceived = 0
      if (payments) {
        totalExpected = payments.reduce((sum, p) => sum + (p.expected_amount || 0), 0)
        totalReceived = payments.reduce((sum, p) => sum + (p.received_amount || 0), 0)
      }

      // Fetch recent parchis
      const { data: parchis } = await supabase
        .from("parchis")
        .select(
          `
          id,
          parchi_type,
          amount,
          parchi_date,
          lands(land_id_code)
        `,
        )
        .order("parchi_date", { ascending: false })
        .limit(5)

      // Fetch upcoming renewals
      const today = new Date().toISOString().split("T")[0]
      const { data: agreements_renewal } = await supabase
        .from("agreements")
        .select(
          `
          id,
          end_date,
          lands(land_id_code),
          farmers(name)
        `,
        )
        .eq("status", "active")
        .gt("end_date", today)
        .lt("end_date", new Date(new Date().setDate(new Date().getDate() + 90)).toISOString().split("T")[0])
        .order("end_date", { ascending: true })
        .limit(5)

      setStats({
        totalLands: landsCount || 0,
        activeAgreements: agreementsCount || 0,
        totalExpectedIncome: totalExpected,
        totalReceivedIncome: totalReceived,
      })

      const formattedParchis = parchis
        ? parchis.map((p: any) => ({
            id: p.id,
            land_id_code: p.lands?.land_id_code || "N/A",
            parchi_type: p.parchi_type,
            amount: p.amount,
            parchi_date: p.parchi_date,
          }))
        : []

      const formattedAgreements = agreements_renewal
        ? agreements_renewal.map((a: any) => ({
            id: a.id,
            land_id_code: a.lands?.land_id_code || "N/A",
            farmer_name: a.farmers?.name || "N/A",
            end_date: a.end_date,
          }))
        : []

      setRecentParchis(formattedParchis)
      setUpcomingAgreements(formattedAgreements)
      setLoading(false)
    }

    fetchDashboardData()
  }, [])

  const StatCard = ({
    icon: Icon,
    label,
    value,
    suffix = "",
  }: {
    icon: React.ReactNode
    label: string
    value: number | string
    suffix?: string
  }) => (
    <Card className="p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">{label}</p>
          <p className="text-4xl font-bold text-primary">
            {typeof value === "number" && label.includes("Income") ? "₹" : ""}
            {value.toLocaleString?.() ?? value}
            {suffix}
          </p>
        </div>
        <div className="p-4 bg-secondary/10 rounded-xl text-secondary text-2xl">{Icon}</div>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const pendingAmount = stats.totalExpectedIncome - stats.totalReceivedIncome

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-8 md:p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 text-9xl">🌾</div>
          <div className="absolute bottom-0 left-0 text-8xl">🚜</div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Welcome Back</h1>
          <p className="text-primary-foreground/90 text-lg">
            Manage your agricultural lands and farming records efficiently
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<MapPin className="w-6 h-6" />} label="Total Lands" value={stats.totalLands} />
        <StatCard icon={<FileText className="w-6 h-6" />} label="Active Agreements" value={stats.activeAgreements} />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Expected Income"
          value={stats.totalExpectedIncome}
          suffix=""
        />
        <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Pending Amount" value={pendingAmount} suffix="" />
      </div>

      {/* Recent Parchis */}
      <Card>
        <div className="p-6 border-b border-border bg-gradient-to-r from-secondary/5 to-accent/5">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📄</div>
            <h2 className="text-xl font-semibold text-foreground">Recent Parchi Uploads</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Land</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentParchis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No recent parchis found
                  </TableCell>
                </TableRow>
              ) : (
                recentParchis.map((parchi) => (
                  <TableRow key={parchi.id}>
                    <TableCell className="font-medium">{parchi.land_id_code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                        {parchi.parchi_type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">₹{parchi.amount?.toLocaleString() || "0"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(parchi.parchi_date).toLocaleDateString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Upcoming Renewals */}
      <Card>
        <div className="p-6 border-b border-border bg-gradient-to-r from-accent/5 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📅</div>
            <h2 className="text-xl font-semibold text-foreground">Upcoming Agreement Renewals (Next 90 Days)</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Land</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Renewal Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingAgreements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No upcoming renewals
                  </TableCell>
                </TableRow>
              ) : (
                upcomingAgreements.map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell className="font-medium">{agreement.land_id_code}</TableCell>
                    <TableCell>{agreement.farmer_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(agreement.end_date).toLocaleDateString("en-IN")}
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
