package api

type ParamsError struct {
	Name string `json:"name"`
	Message string `json:"message"`
	Params map[string]string `json:"parameters"`
}

func (e ParamsError) Error() string {
	return e.Message
}

func NewParamsError(message string, params map[string]string) ParamsError {
	return ParamsError{
		"ParameterError",
		message,
		params,
	}
}