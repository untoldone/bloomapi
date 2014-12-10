package bloomapi

import "strconv"

func keysToStrings(toConvert map[string]interface{}) {
	for k, v := range toConvert {
		switch v.(type) {
		case int:
			toConvert[k] = strconv.Itoa(v.(int))
		case float64:
			toConvert[k] = strconv.FormatFloat(v.(float64), 'f', -1, 64)
		case map[string]interface{}:
			keysToStrings(v.(map[string]interface{}))
		case []interface{}:
			for _, elm := range v.([]interface{}) {
				keysToStrings(elm.(map[string]interface{}))
			}
		}
	}
}