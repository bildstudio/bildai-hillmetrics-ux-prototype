"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileSpreadsheet, Download } from "lucide-react"

interface XlsxPreviewProps {
  fileName: string
}

// Mock data for XLSX preview
const mockSheets = {
  Sheet1: {
    headers: ["ID", "Name", "Email", "Department", "Salary", "Start Date"],
    data: [
      ["001", "John Doe", "john.doe@company.com", "Engineering", "$75,000", "2023-01-15"],
      ["002", "Jane Smith", "jane.smith@company.com", "Marketing", "$65,000", "2023-02-20"],
      ["003", "Mike Johnson", "mike.johnson@company.com", "Sales", "$70,000", "2023-03-10"],
      ["004", "Sarah Wilson", "sarah.wilson@company.com", "HR", "$60,000", "2023-04-05"],
      ["005", "David Brown", "david.brown@company.com", "Finance", "$80,000", "2023-05-12"],
      ["006", "Lisa Davis", "lisa.davis@company.com", "Engineering", "$78,000", "2023-06-18"],
      ["007", "Tom Miller", "tom.miller@company.com", "Marketing", "$62,000", "2023-07-22"],
      ["008", "Amy Taylor", "amy.taylor@company.com", "Sales", "$68,000", "2023-08-14"],
    ],
  },
  Summary: {
    headers: ["Department", "Total Employees", "Average Salary", "Total Budget"],
    data: [
      ["Engineering", "2", "$76,500", "$153,000"],
      ["Marketing", "2", "$63,500", "$127,000"],
      ["Sales", "2", "$69,000", "$138,000"],
      ["HR", "1", "$60,000", "$60,000"],
      ["Finance", "1", "$80,000", "$80,000"],
    ],
  },
  Metrics: {
    headers: ["Metric", "Q1", "Q2", "Q3", "Q4"],
    data: [
      ["Revenue", "$125,000", "$145,000", "$165,000", "$185,000"],
      ["Expenses", "$95,000", "$105,000", "$115,000", "$125,000"],
      ["Profit", "$30,000", "$40,000", "$50,000", "$60,000"],
      ["Growth Rate", "8%", "12%", "15%", "18%"],
    ],
  },
}

export function XlsxPreview({ fileName }: XlsxPreviewProps) {
  const [activeSheet, setActiveSheet] = useState("Sheet1")
  const sheetNames = Object.keys(mockSheets)
  const currentSheet = mockSheets[activeSheet as keyof typeof mockSheets]

  return (
    <Card className="h-full flex flex-col bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <span className="truncate">{fileName}</span>
          </CardTitle>
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs value={activeSheet} onValueChange={setActiveSheet} className="h-full flex flex-col">
          <div className="px-6 border-b">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100">
              {sheetNames.map((sheetName) => (
                <TabsTrigger
                  key={sheetName}
                  value={sheetName}
                  className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900"
                >
                  {sheetName}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {sheetNames.map((sheetName) => (
            <TabsContent key={sheetName} value={sheetName} className="flex-1 overflow-auto m-0 p-6">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      {currentSheet.headers.map((header, index) => (
                        <TableHead key={index} className="font-semibold text-gray-900 border-r last:border-r-0">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSheet.data.map((row, rowIndex) => (
                      <TableRow key={rowIndex} className="hover:bg-gray-50">
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex} className="border-r last:border-r-0 text-sm">
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
                <span>
                  {currentSheet.data.length} rows × {currentSheet.headers.length} columns
                </span>
                <span>Sheet: {sheetName}</span>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
