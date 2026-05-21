import { bech32 } from 'bech32';

const nsecKey = "nsec1tvkfaqcx50msuxky8dczyv2k75fvcyv6fn9vhd7h0hrn5hxywyms0u3r6q";

try {
  const decoded = bech32.decode(nsecKey);
  console.log('Prefix:', decoded.prefix);
  console.log('Words length:', decoded.words.length);
  const bytes = bech32.fromWords(decoded.words);
  console.log('Bytes length:', bytes.length);
  console.log('Bytes:', bytes);
} catch (e) {
  console.error('Error:', e);
}