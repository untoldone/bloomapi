package handler_compat

import "strconv"

// Helper to turn all non-string values into strings.
// This is to ensure API backwards compatibility for clients
// that expect all values to be strings
func valuesToStrings(toConvert map[string]interface{}) {
	for k, v := range toConvert {
		switch v.(type) {
		case int:
			toConvert[k] = strconv.Itoa(v.(int))
		case float64:
			toConvert[k] = strconv.FormatFloat(v.(float64), 'f', -1, 64)
		case map[string]interface{}:
			valuesToStrings(v.(map[string]interface{}))
		case []interface{}:
			for _, elm := range v.([]interface{}) {
				valuesToStrings(elm.(map[string]interface{}))
			}
		}
	}
}