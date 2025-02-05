import {
  InputGroup,
  InputLeftAddon,
  Input,
  Select,
  HStack,
} from '@chakra-ui/react'

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'IN' },
  { code: '+61', country: 'AU' },
  { code: '+86', country: 'CN' },
  { code: '+81', country: 'JP' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+34', country: 'ES' },
  { code: '+39', country: 'IT' },
  { code: '+55', country: 'BR' },
  { code: '+52', country: 'MX' },
  { code: '+65', country: 'SG' },
  { code: '+971', country: 'UAE' },
]

function PhoneInput({ value, onChange, placeholder = "Phone number", ...props }) {
  // Split phone number into country code and number
  const splitPhoneNumber = (phone) => {
    if (!phone) return { countryCode: '+1', number: '' }
    const code = COUNTRY_CODES.find(c => phone.startsWith(c.code))
    if (code) {
      return {
        countryCode: code.code,
        number: phone.substring(code.code.length)
      }
    }
    return { countryCode: '+1', number: phone }
  }

  const { countryCode, number } = splitPhoneNumber(value)

  const handleCountryCodeChange = (e) => {
    const newCode = e.target.value
    onChange(newCode + number)
  }

  const handleNumberChange = (e) => {
    const newNumber = e.target.value
    onChange(countryCode + newNumber)
  }

  return (
    <InputGroup size="md" {...props}>
      <InputLeftAddon p={0} bg="transparent" border="none">
        <Select
          value={countryCode}
          onChange={handleCountryCodeChange}
          borderTopRightRadius={0}
          borderBottomRightRadius={0}
          focusBorderColor="brand.teal"
          w="auto"
        >
          {COUNTRY_CODES.map(({ code, country }) => (
            <option key={code} value={code}>
              {code} {country}
            </option>
          ))}
        </Select>
      </InputLeftAddon>
      <Input
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        type="tel"
        borderLeftRadius={0}
        focusBorderColor="brand.teal"
      />
    </InputGroup>
  )
}

export default PhoneInput 