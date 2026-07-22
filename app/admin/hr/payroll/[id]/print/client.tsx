'use client'

import { useEffect } from 'react'

export default function PrintPayslipClient({ payslip }: { payslip: any }) {
  
  useEffect(() => {
    // Automatically trigger print dialog when page loads
    // Adding a tiny delay ensures styles are fully applied
    const timer = setTimeout(() => {
      window.print()
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: auto;
            margin: 15mm;
          }
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100% !important;
            margin: 0;
            padding: 0 !important;
            box-shadow: none;
            border: none;
          }
        }
      `}} />
      <div id="print-section" className="w-full max-w-2xl print:max-w-full bg-white text-black p-8 print:p-0 rounded border border-gray-200 shadow-sm mx-auto my-8 print:my-0">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-200">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">SmartHotel</h1>
                <p className="text-gray-500 text-sm">Experience Elite</p>
                <div className="mt-4">
                    <p className="font-semibold text-gray-800">Payslip</p>
                    <p className="text-sm text-gray-600">Period: {new Date(payslip.periodStart).toLocaleDateString()} to {new Date(payslip.periodEnd).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-500">Payslip ID</p>
                <p className="font-mono text-xs text-gray-700">{payslip.id}</p>
                <p className="text-sm text-gray-500 mt-2">Generated On</p>
                <p className="text-xs text-gray-700">{new Date(payslip.createdAt).toLocaleDateString()}</p>
            </div>
        </div>

        {/* Employee Info */}
        <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Employee Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{payslip.employee?.firstName} {payslip.employee?.lastName}</p>
                </div>
                <div>
                    <p className="text-gray-500">Employee ID</p>
                    <p className="font-medium">{payslip.employeeId}</p>
                </div>
                <div>
                    <p className="text-gray-500">Department</p>
                    <p className="font-medium">{payslip.employee?.department || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium">{payslip.employee?.status}</p>
                </div>
            </div>
        </div>

        {/* Financials */}
        <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Earnings & Deductions</h2>
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                        <th className="py-2 px-4 font-semibold text-gray-700">Description</th>
                        <th className="py-2 px-4 font-semibold text-gray-700 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    <tr>
                        <td className="py-3 px-4">Base Salary</td>
                        <td className="py-3 px-4 text-right">${payslip.baseAmount.toFixed(2)}</td>
                    </tr>
                    {payslip.overtimeAmount > 0 && (
                        <tr>
                            <td className="py-3 px-4 text-emerald-600">Overtime Pay</td>
                            <td className="py-3 px-4 text-right text-emerald-600">+${payslip.overtimeAmount.toFixed(2)}</td>
                        </tr>
                    )}
                    {payslip.bonuses > 0 && (
                        <tr>
                            <td className="py-3 px-4 text-emerald-600">Bonuses</td>
                            <td className="py-3 px-4 text-right text-emerald-600">+${payslip.bonuses.toFixed(2)}</td>
                        </tr>
                    )}
                    {payslip.deductions > 0 && (
                        <tr>
                            <td className="py-3 px-4 text-rose-600">Deductions/Taxes</td>
                            <td className="py-3 px-4 text-right text-rose-600">-${payslip.deductions.toFixed(2)}</td>
                        </tr>
                    )}
                </tbody>
                <tfoot className="border-t-2 border-gray-800">
                    <tr>
                        <td className="py-4 px-4 font-bold text-gray-900 text-lg">Net Pay</td>
                        <td className="py-4 px-4 font-bold text-gray-900 text-lg text-right">${payslip.netPay.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>This is a system generated payslip.</p>
            <p>SmartHotel Administration • Experience Elite</p>
            
            <div className="mt-8 print:hidden">
                <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                >
                    Print Now
                </button>
                <button 
                    onClick={() => window.close()}
                    className="ml-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                    Close Window
                </button>
            </div>
        </div>
    </div>
    </>
  )
}
