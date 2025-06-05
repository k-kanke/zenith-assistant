package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type GeminiRequest struct {
	Message string `json:"message"`
}

func GeminiRouteHandler(c *gin.Context) {
	_ = godotenv.Load()

	var req GeminiRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	currrentYear := time.Now().Year()

	prompt := fmt.Sprintf(`現在は %d 年です。次の日本語の文章から、以下の形式でユーザーの意図と必要情報を抽出してください。

必ず以下の intent 候補から1つを選んでください：
- "free_slot_request"：空き時間を取得したい
- "schedule_register"：予定を登録したい（ただし確認・編集前提）
- "schedule_register_direct"：命令形（「登録しておいて」など）で、そのまま即登録可能なもの
- "unknown"：どれにも当てはまらない場合

必ず intent をそのまま文字列で返してください。出力は以下の形式でJSONオブジェクトとしてください：

出力形式（JSON）:
{
  "intent": "...",
  "emails": [...],          // メールアドレスの配列
  "date": "YYYY-MM-DD",     // 日付
  "start_time": "HH:MM",    // 開始時刻（任意）
  "duration": "...",        // 所要時間（任意）
  "title": "..."            // タイトル（任意）
}

ユーザーの入力:
%s
`, currrentYear, req.Message)

	// log.Println("[Prompt]:", prompt)

	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"role": "user",
				"parts": []map[string]string{
					{"text": prompt},
				},
			},
		},
	}
	// log.Println("[requstBody]:", requestBody)

	jsonBody, _ := json.Marshal(requestBody)
	// log.Println("[jsonBody]:", jsonBody)

	apiKey := os.Getenv("GEMINI_API_KEY")
	// log.Println("[GeminiAPI]:", apiKey)

	endpoint := "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=" + apiKey

	resp, err := http.Post(endpoint, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to contact Gemini API"})
		return
	}
	defer resp.Body.Close()

	log.Println("[resp]:", resp)

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	_ = json.Unmarshal(body, &result)

	text := extractText(result)
	log.Println("[text]:", text)

	jsonStart := strings.Index(text, "{")
	jsonEnd := strings.LastIndex(text, "}")
	if jsonStart == -1 || jsonEnd == -1 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid response from Gemini"})
		return
	}

	parsedJSON := text[jsonStart : jsonEnd+1]
	var parsed map[string]interface{}
	if err := json.Unmarshal([]byte(parsedJSON), &parsed); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse JSON from Gemini response"})
		return
	}

	log.Println("[parsedJSON]:", parsedJSON)

	c.JSON(http.StatusOK, parsed)
}

func extractText(res map[string]interface{}) string {
	candidates, ok := res["candidates"].([]interface{})
	if !ok || len(candidates) == 0 {
		return ""
	}
	candidate := candidates[0].(map[string]interface{})
	content := candidate["content"].(map[string]interface{})
	parts := content["parts"].([]interface{})
	part := parts[0].(map[string]interface{})
	return part["text"].(string)
}
