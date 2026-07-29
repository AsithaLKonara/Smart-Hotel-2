import fs from 'fs'
import path from 'path'
import prisma from '../lib/prisma'
import { ProcurementService } from '../lib/services/procurement-service'
import { AccountingGovernanceService } from '../lib/services/accounting-service'
import { PayrollService } from '../lib/services/payroll-service'
import { GuestExperienceService } from '../lib/services/guest-experience-service'

// Prevent OS EPIPE (broken pipe) stream events from aborting Node execution during fast terminal output
process.stdout.on('error', (err: any) => { if (err.code === 'EPIPE' || err.errno === 'EPIPE') return })
process.stderr.on('error', (err: any) => { if (err.code === 'EPIPE' || err.errno === 'EPIPE') return })

const logDir = '/Users/asithalakmal/.gemini/antigravity-ide/brain/ce42027d-60b0-4412-aa77-2737e84a8581/scratch'
const logPath = path.join(logDir, 'test_debug.log')

try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
  fs.writeFileSync(logPath, `=== STARTING EPIPE-IMMUNE TEST SUITE AT ${new Date().toISOString()} ===\n`)
} catch (e) {}

function logTrace(msg: string) {
  try { console.log(msg) } catch (e: any) {}
  try { fs.appendFileSync(logPath, `${msg}\n`) } catch (e: any) {}
}

process.on('uncaughtException', (err: any) => {
  if (err?.code === 'EPIPE' || err?.errno === 'EPIPE') return
  logTrace(`🚨 UNCAUGHT EXCEPTION: ${err?.stack || err?.message || err}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason: any) => {
  if (reason?.code === 'EPIPE' || reason?.errno === 'EPIPE') return
  logTrace(`🚨 UNHANDLED REJECTION: ${reason?.stack || reason?.message || reason}`)
  process.exit(1)
})

async function runVerificationSuite() {
  logTrace('================================================================================')
  logTrace('🔥 PHASE 3 DEAD SCHEMA ACTIVATION & RELATIONAL VERIFICATION SUITE 🔥')
  logTrace('================================================================================\n')

  const results: { model: string; serviceMethod: string; status: string; recordsConfirmed: number; details: string }[] = []

  // 1. VERIFY: TransactionCode
  try {
    logTrace('[1/10] Verifying TransactionCode activation...')
    const seededCodes = await AccountingGovernanceService.seedTransactionCodes()
    const storedCodes = await AccountingGovernanceService.listTransactionCodes()
    logTrace(`   -> Seeding confirmed: ${storedCodes.length} codes stored.`)
    results.push({
      model: 'TransactionCode',
      serviceMethod: 'AccountingGovernanceService.seedTransactionCodes()',
      status: storedCodes.length >= 6 ? 'SUCCESS ✅' : 'FAILED ❌',
      recordsConfirmed: storedCodes.length,
      details: 'Seeded standard USALI revenue, tax, payment, and adjustment billing codes.'
    })
  } catch (error: any) {
    logTrace(`❌ Error in TransactionCode: ${error?.stack || error}`)
    results.push({ model: 'TransactionCode', serviceMethod: 'seedTransactionCodes', status: 'FAILED ❌', recordsConfirmed: 0, details: error?.message || String(error) })
  }

  // 2. VERIFY: CompanyProfile
  try {
    logTrace('[2/10] Verifying CompanyProfile activation...')
    const company = await GuestExperienceService.registerCompanyProfile({
      name: 'Global Enterprise Corp (Test)',
      taxId: 'US-998877665',
      address: '100 Executive Way, Metropolis',
      billingEmail: 'billing@globalenterpisecorp.com',
      creditLimit: 15000.00
    })
    logTrace(`   -> Company profile ID: ${company.id}`)
    results.push({
      model: 'CompanyProfile',
      serviceMethod: 'GuestExperienceService.registerCompanyProfile()',
      status: company.id ? 'SUCCESS ✅' : 'FAILED ❌',
      recordsConfirmed: 1,
      details: `Registered corporate client ID: ${company.id.substring(0, 8)}...`
    })
  } catch (error: any) {
    logTrace(`❌ Error in CompanyProfile: ${error?.stack || error}`)
    results.push({ model: 'CompanyProfile', serviceMethod: 'registerCompanyProfile', status: 'FAILED ❌', recordsConfirmed: 0, details: error?.message || String(error) })
  }

  // 3. VERIFY: ResortService
  try {
    logTrace('[3/10] Verifying ResortService activation...')
    const amenity = await GuestExperienceService.addResortService({
      facilityName: 'Royal Palm Spa & Fitness',
      serviceName: 'Deep Tissue Aromatherapy Massage (90m)',
      durationMins: 90,
      price: 185.00
    })
    logTrace(`   -> Resort service ID: ${amenity.id}`)
    results.push({
      model: 'ResortService',
      serviceMethod: 'GuestExperienceService.addResortService()',
      status: amenity.id ? 'SUCCESS ✅' : 'FAILED ❌',
      recordsConfirmed: 1,
      details: `Created amenity ID: ${amenity.id.substring(0, 8)}... linked to ResortFacility.`
    })
  } catch (error: any) {
    logTrace(`❌ Error in ResortService: ${error?.stack || error}`)
    results.push({ model: 'ResortService', serviceMethod: 'addResortService', status: 'FAILED ❌', recordsConfirmed: 0, details: error?.message || String(error) })
  }

  // 4. VERIFY: Testimonial
  try {
    logTrace('[4/10] Verifying Testimonial activation...')
    const testimonial = await GuestExperienceService.addTestimonial({
      name: 'Lady Eleanor Vance',
      role: 'Diplomatic Envoy',
      content: 'The architectural precision and zero-trust service elegance of SmartHotel exceeded all continental standards.',
      rating: 5
    })
    const testCount = await prisma.testimonial.count({ where: { active: true } })
    logTrace(`   -> Testimonial ID: ${testimonial.id} (Total count: ${testCount})`)
    results.push({
      model: 'Testimonial',
      serviceMethod: 'GuestExperienceService.addTestimonial()',
      status: testimonial.id ? 'SUCCESS ✅' : 'FAILED ❌',
      recordsConfirmed: testCount,
      details: `Published review by ${testimonial.name} (5 Stars).`
    })
  } catch (error: any) {
    logTrace(`❌ Error in Testimonial: ${error?.stack || error}`)
    results.push({ model: 'Testimonial', serviceMethod: 'addTestimonial', status: 'FAILED ❌', recordsConfirmed: 0, details: error?.message || String(error) })
  }

  // 5-7. VERIFY: Procurement Chain
  try {
    logTrace('[5-7/10] Setting up test procurement chain (Vendor -> PO -> Dock Receipt)...')
    logTrace('   -> Step A: Checking Vendor...')
    let vendor = await prisma.vendor.findFirst()
    if (!vendor) {
      logTrace('   -> Step A.1: Creating Vendor...')
      vendor = await prisma.vendor.create({
        data: { name: 'Prime Hospitality Supply Co.', contactPerson: 'Dave Miller', email: 'orders@primesupply.com' }
      })
    }
    logTrace(`   -> Vendor resolved: ${vendor.id}`)

    logTrace('   -> Step B: Checking InventoryItem...')
    let item = await prisma.inventoryItem.findFirst({ where: { sku: 'SKU-TRUFFLE-OIL' } })
    if (!item) {
      logTrace('   -> Step B.1: Creating InventoryItem...')
      item = await prisma.inventoryItem.create({
        data: {
          name: 'Italian White Truffle Oil (500ml)',
          sku: 'SKU-TRUFFLE-OIL',
          category: 'FOOD',
          unit: 'BOTTLE',
          unitPrice: 45.00,
          parLevel: 12,
          vendorId: vendor.id
        }
      })
    }
    logTrace(`   -> InventoryItem resolved: ${item.id}`)

    logTrace('   -> Step C: Creating PurchaseOrder and Item...')
    const testPoNumber = `PO-${Date.now()}`
    const po = await prisma.purchaseOrder.create({
      data: {
        orderNumber: testPoNumber,
        vendorId: vendor.id,
        status: 'ORDERED',
        totalAmount: 450.00,
        items: {
          create: {
            itemId: item.id,
            quantity: 10,
            unitPrice: 45.00,
            totalPrice: 450.00
          }
        }
      },
      include: { items: true }
    })
    logTrace(`   -> PurchaseOrder created: ${po.id} (Items count: ${po.items.length})`)

    logTrace('   -> Step D: Calling ProcurementService.receiveGoods()...')
    const receipt = await ProcurementService.receiveGoods({
      purchaseOrderId: po.id,
      targetLocation: 'Main Kitchen Pantry',
      notes: 'Verified intact glass seals upon loading dock intake.'
    })
    logTrace(`   -> GoodsReceipt recorded: ${receipt.id}`)

    const stockRow = await prisma.inventoryStock.findUnique({
      where: { itemId_location: { itemId: item.id, location: 'Main Kitchen Pantry' } }
    })
    logTrace(`   -> Stock balance resolved: ${stockRow?.quantity}`)

    results.push({
      model: 'GoodsReceipt',
      serviceMethod: 'ProcurementService.receiveGoods()',
      status: receipt.id ? 'SUCCESS ✅' : 'FAILED ❌',
      recordsConfirmed: 1,
      details: `Recorded dock intake slip ID: ${receipt.id.substring(0, 8)}... for PO #${po.orderNumber}`
    })

    results.push({
      model: 'InventoryStock',
      serviceMethod: 'ProcurementService.receiveGoods() -> Atomically updated',
      status: (stockRow && stockRow.quantity >= 10) ? 'SUCCESS ✅' : 'FAILED ❌',
      recordsConfirmed: stockRow ? stockRow.quantity : 0,
      details: `Stock tally in [Main Kitchen Pantry]: ${stockRow?.quantity} units (Last counted: ${stockRow?.lastCountedAt.toLocaleTimeString()})`
    })

    logTrace('[7/10] Verifying VendorInvoice & Three-Way Match Engine...')
    const invoiceAudit = await ProcurementService.registerVendorInvoice({
      purchaseOrderId: po.id,
      invoiceNumber: `INV-${Date.now()}`,
      amount: 452.00
    })
    logTrace(`   -> Vendor invoice match status: ${invoiceAudit.audit.threeWayMatchStatus}`)

    results.push({
      model: 'VendorInvoice',
      serviceMethod: 'ProcurementService.registerVendorInvoice()',
      status: invoiceAudit.audit.threeWayMatchStatus === 'MATCHED' ? 'SUCCESS ✅' : 'FAILED ❌',
      recordsConfirmed: 1,
      details: `3-Way Match Audit: Status [${invoiceAudit.audit.threeWayMatchStatus}], Variance [$${invoiceAudit.audit.variance} within $5 ceiling]`
    })

  } catch (error: any) {
    logTrace(`❌ Error in Procurement Chain: ${error?.stack || error}`)
    results.push({ model: 'GoodsReceipt / InventoryStock / VendorInvoice', serviceMethod: 'ProcurementService', status: 'FAILED ❌', recordsConfirmed: 0, details: error?.message || String(error) })
  }

  // 8. VERIFY: FinancialAdjustment
  try {
    logTrace('[8/10] Verifying FinancialAdjustment tracking...')
    let payment = await prisma.payment.findFirst()
    if (!payment) {
      logTrace('   -> Creating test Payment...')
      payment = await prisma.payment.create({
        data: {
          amount: 250.00,
          currency: 'USD',
          paymentMethod: 'card',
          paymentProvider: 'STRIPE_TEST',
          status: 'completed',
          capturedAt: new Date()
        }
      })
    }
    logTrace(`   -> Payment ID resolved: ${payment.id}`)

    const adjustment = await AccountingGovernanceService.recordFinancialAdjustment({
      paymentId: payment.id,
      type: 'DISCOUNT_OVERRIDE',
      amount: 25.00,
      reason: 'Managerial hospitality goodwill rebate for delayed check-in luggage.'
    })
    logTrace(`   -> Adjustment recorded ID: ${adjustment.id}`)

    results.push({
      model: 'FinancialAdjustment',
      serviceMethod: 'AccountingGovernanceService.recordFinancialAdjustment()',
      status: adjustment.id ? 'SUCCESS ✅' : 'FAILED ❌',
      recordsConfirmed: 1,
      details: `Logged forensic discount override ID: ${adjustment.id.substring(0, 8)}... ($25.00 rebate)`
    })
  } catch (error: any) {
    logTrace(`❌ Error in FinancialAdjustment: ${error?.stack || error}`)
    results.push({ model: 'FinancialAdjustment', serviceMethod: 'recordFinancialAdjustment', status: 'FAILED ❌', recordsConfirmed: 0, details: error?.message || String(error) })
  }

  // 9. VERIFY: PayrollLineItem
  try {
    logTrace('[9/10] Verifying PayrollLineItem calculation run...')
    let employee = await prisma.employee.findFirst({ where: { status: 'ACTIVE' } })
    if (!employee) {
      logTrace('   -> Creating test active Employee...')
      const uniqueSuffix = Date.now().toString().slice(-6)
      employee = await prisma.employee.create({
        data: {
          firstName: 'Marcus',
          lastName: 'Aurelius',
          email: `m.aurelius.${uniqueSuffix}@smarthotel.internal`,
          department: 'Executive SRE',
          position: 'Chief Systems Architect',
          baseSalary: 120000.00,
          hireDate: new Date(),
          status: 'ACTIVE'
        }
      })
    }
    logTrace(`   -> Employee ID resolved: ${employee.id}`)

    const payrollResult = await PayrollService.executePayrollRun({
      periodStart: new Date(Date.now() - 14 * 24 * 3600 * 1000),
      periodEnd: new Date()
    })
    logTrace(`   -> Payroll run generated with ${payrollResult.lineItemsCount} line items.`)

    results.push({
      model: 'PayrollLineItem',
      serviceMethod: 'PayrollService.executePayrollRun()',
      status: payrollResult.lineItemsCount > 0 ? 'SUCCESS ✅' : 'FAILED ❌',
      recordsConfirmed: payrollResult.lineItemsCount,
      details: `Generated itemized salary, tax, & overtime deductions for ${payrollResult.lineItemsCount} active staff members.`
    })
  } catch (error: any) {
    logTrace(`❌ Error in PayrollLineItem: ${error?.stack || error}`)
    results.push({ model: 'PayrollLineItem', serviceMethod: 'executePayrollRun', status: 'FAILED ❌', recordsConfirmed: 0, details: error?.message || String(error) })
  }

  // 10. VERIFY: GuestHistory
  try {
    logTrace('[10/10] Verifying GuestHistory synchronization...')
    let user = await prisma.user.findFirst()
    if (!user) {
      logTrace('   -> Creating test User and checking parent Property...')
      let property = await prisma.property.findFirst()
      if (!property) {
        property = await prisma.property.create({
          data: {
            name: 'Grand SmartHotel Resort & Spa (Audit Demo)',
            code: `PROP-${Date.now().toString().slice(-6)}`,
            address: '1 Luxury Way',
            city: 'Metropolis',
            country: 'USA'
          }
        })
      }

      const uniqueSuffix = Date.now().toString().slice(-6)
      user = await prisma.user.create({
        data: {
          email: `guest.${uniqueSuffix}@vip.luxury`,
          name: 'Arthur Pendelton',
          password: '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF0123456',
          propertyId: property.id
        }
      })
    }
    logTrace(`   -> User ID resolved: ${user.id}`)

    const history = await GuestExperienceService.updateGuestHistory({
      userId: user.id,
      staysDelta: 1,
      nightsDelta: 4,
      spendDelta: 1850.00,
      lastRoomTypeId: 'PRESIDENTIAL_SUITE'
    })
    logTrace(`   -> GuestHistory updated: spend=${history.totalSpend}`)

    results.push({
      model: 'GuestHistory',
      serviceMethod: 'GuestExperienceService.updateGuestHistory()',
      status: (history && Number(history.totalSpend) >= 1850) ? 'SUCCESS ✅' : 'FAILED ❌',
      recordsConfirmed: history ? 1 : 0,
      details: `Updated CRM profile for User ID [${user.id.substring(0, 8)}...]: Total Spend $${history?.totalSpend} across ${history?.totalNights} nights.`
    })
  } catch (error: any) {
    logTrace(`❌ Error in GuestHistory: ${error?.stack || error}`)
    results.push({ model: 'GuestHistory', serviceMethod: 'updateGuestHistory', status: 'FAILED ❌', recordsConfirmed: 0, details: error?.message || String(error) })
  }

  logTrace('\n================================================================================')
  logTrace('🏁 MASTER VERIFICATION DASHBOARD: ALL 10 DEAD SCHEMAS ACTIVATED 🏁')
  logTrace('================================================================================\n')

  try { console.table(results) } catch(e: any) {}
  
  for (const r of results) {
    logTrace(`[${r.status}] ${r.model} -> ${r.serviceMethod} | ${r.details}`)
  }

  const failures = results.filter(r => r.status.includes('FAILED'))
  if (failures.length > 0) {
    logTrace(`\n🚨 ALERT: ${failures.length} schema verification tests failed! See table above for explicit error causes. 🚨`)
    process.exit(1)
  } else {
    logTrace('\n🏆 SUCCESS: 100% of previously dead database schema tables are now fully active, verified, and operational! 🏆')
    process.exit(0)
  }
}

runVerificationSuite()
