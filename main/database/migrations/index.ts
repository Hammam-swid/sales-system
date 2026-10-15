import { InitialSchema1760000000000 } from './1760000000000-InitialSchema'
import { PartyPayments1760400000000 } from './1760400000000-PartyPayments'
import { StoreFeatures1760800000000 } from './1760800000000-StoreFeatures'
import { CategoryNoteOptions1760900000000 } from './1760900000000-CategoryNoteOptions'

// Listed explicitly (no glob paths) so migrations survive bundling and asar packaging.
// Append new migrations to the end of this array.
export const migrations = [
  InitialSchema1760000000000,
  PartyPayments1760400000000,
  StoreFeatures1760800000000,
  CategoryNoteOptions1760900000000
]
