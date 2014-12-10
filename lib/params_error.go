package bloomapi

type paramsError struct {
	Name string `json:"name"`
	Message string `json:"message"`
	Params map[string]string `json:"parameters"`
}

func (e paramsError) Error() string {
	return e.Message
}

func NewParamsError(message string, params map[string]string) paramsError {
	return paramsError{
		"ParameterError",
		message,
		params,
	}
}