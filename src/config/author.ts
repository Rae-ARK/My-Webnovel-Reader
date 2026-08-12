import rawConfig from './author.config.reader.json'
import { parseAuthorConfig } from './author.schema'

// Fails fast with a readable error if author.config.reader.json is
// malformed, instead of letting an undefined field reach a component
// later on. See scripts/setup-author.py for the supported way to
// generate/update this file from the published database.
const config = parseAuthorConfig(rawConfig)

export default config
