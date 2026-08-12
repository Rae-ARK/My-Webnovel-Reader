import rawConfig from './site.config.reader'
import { parseSiteConfig } from './site.schema'

// Fails fast with a readable error if site.config.reader.ts is
// malformed, instead of letting an undefined field reach a component
// later on.
const config = parseSiteConfig(rawConfig)

export default config
