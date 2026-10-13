import { InitialSchema1760000000000 } from './1760000000000-InitialSchema'

// Listed explicitly (no glob paths) so migrations survive bundling and asar packaging.
// Append new migrations to the end of this array.
export const migrations = [InitialSchema1760000000000]
