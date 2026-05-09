import crypto from 'crypto'

export interface LedgerBlock {
  sequenceNumber: number
  batchId: string
  propertyId: string
  businessDate: string
  debitCreditPayloadHash: string
  previousBlockHash: string
  blockHash: string
}

export class ImmutableAudit {
  private static blockChain: LedgerBlock[] = []

  // Computes SHA-256 hash representing debits and credits
  static computePayloadHash(lines: Array<{ accountCode: string; debit: number; credit: number }>): string {
    const payloadStr = JSON.stringify(lines.sort((a, b) => a.accountCode.localeCompare(b.accountCode)))
    return crypto.createHash('sha256').update(payloadStr).digest('hex')
  }

  // Computes the Block Signature linking previous block hash signatures
  static computeBlockHash(
    sequenceNumber: number,
    batchId: string,
    propertyId: string,
    businessDate: string,
    payloadHash: string,
    previousHash: string
  ): string {
    const metaStr = `${sequenceNumber}:${batchId}:${propertyId}:${businessDate}:${payloadHash}:${previousHash}`
    return crypto.createHash('sha256').update(metaStr).digest('hex')
  }

  // Cryptographically locks balanced Journal entries into the Ledger chain
  static appendJournalBlock(
    batchId: string,
    propertyId: string,
    businessDate: string,
    lines: Array<{ accountCode: string; debit: number; credit: number }>
  ): LedgerBlock {
    const sequence = this.blockChain.length + 1
    const payloadHash = this.computePayloadHash(lines)
    const prevBlock = this.blockChain[this.blockChain.length - 1]
    const previousHash = prevBlock ? prevBlock.blockHash : '0000000000000000000000000000000000000000000000000000000000000000'

    const hash = this.computeBlockHash(sequence, batchId, propertyId, businessDate, payloadHash, previousHash)

    const block: LedgerBlock = {
      sequenceNumber: sequence,
      batchId,
      propertyId,
      businessDate,
      debitCreditPayloadHash: payloadHash,
      previousBlockHash: previousHash,
      blockHash: hash
    }

    this.blockChain.push(block)
    return block
  }

  // Audits the whole ledger chain to verify sequence continuity (detects any manual edits or tampering)
  static verifyChainIntegrity(): { isValid: boolean; corruptedBlockIndex?: number } {
    for (let i = 0; i < this.blockChain.length; i++) {
      const current = this.blockChain[i]
      const prevBlock = i > 0 ? this.blockChain[i - 1] : null
      const expectedPreviousHash = prevBlock ? prevBlock.blockHash : '0000000000000000000000000000000000000000000000000000000000000000'

      // Check 1: Verify link continuity
      if (current.previousBlockHash !== expectedPreviousHash) {
        return { isValid: false, corruptedBlockIndex: i }
      }

      // Check 2: Verify block signature hash matches contents
      const computed = this.computeBlockHash(
        current.sequenceNumber,
        current.batchId,
        current.propertyId,
        current.businessDate,
        current.debitCreditPayloadHash,
        current.previousBlockHash
      )

      if (current.blockHash !== computed) {
        return { isValid: false, corruptedBlockIndex: i }
      }
    }

    return { isValid: true }
  }

  static getBlock(seq: number): LedgerBlock | undefined {
    return this.blockChain.find(b => b.sequenceNumber === seq)
  }

  // Force-corrupts a block to simulate tamper audits during tests
  static forceCorruptBlock(seq: number, malformedHash: string): void {
    const block = this.blockChain.find(b => b.sequenceNumber === seq)
    if (block) {
      block.blockHash = malformedHash
    }
  }

  static clearAll(): void {
    this.blockChain = []
  }
}

export default ImmutableAudit
