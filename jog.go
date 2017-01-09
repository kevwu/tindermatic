package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

// in go cuz I don't wanna deal with async requests in node
func main() {
	cFile, err := ioutil.ReadFile("config.json")
	config := map[string]interface{}{}
	err = json.Unmarshal(cFile, &config)
	if err != nil {
		panic("Error: " + err.Error())
	}

	authToken := config["token"].(string)

	dest := config["location"].(map[string]interface{})
	destLat := dest["lat"].(float64)
	destLon := dest["lon"].(float64)
	/*	(struct{
			lat float64
			lon float64
		})
	*/

	fmt.Println("Destination: " + strconv.FormatFloat(destLat, 'E', -1, 64) + "," + strconv.FormatFloat(destLon, 'E', -1, 64))

	reader := bufio.NewReader(os.Stdin)
	fmt.Print("Current lat: ")
	latTxt, _ := reader.ReadString('\n')
	latTxt = latTxt[:len(latTxt)-1]
	currLat, err := strconv.ParseFloat(latTxt, 64)
	if err != nil {
		panic("Invalid location: " + err.Error())
	}

	fmt.Print("Current lon: ")
	lonTxt, _ := reader.ReadString('\n')
	lonTxt = lonTxt[:len(lonTxt)-1]
	currLon, err := strconv.ParseFloat(lonTxt, 64)
	if err != nil {
		panic("Invalid location: " + err.Error())
	}

	var stepSize = float64(0.05)

	angle := math.Atan((destLon - currLon) / (destLat - currLat))

	client := &http.Client{}

	for math.Abs(destLon-currLon) > stepSize && math.Abs(destLat-currLat) > stepSize {
		currLat += stepSize * math.Cos(angle)
		currLon += stepSize * math.Sin(angle)

		fmt.Println("Stepping to: " + strconv.FormatFloat(currLat, 'f', -1, 64) + "," + strconv.FormatFloat(currLon, 'f', -1, 64))

		var respBody = []byte(`{ "lat":` + strconv.FormatFloat(currLat, 'f', -1, 64) + `, "lon":` + strconv.FormatFloat(currLon, 'f', -1, 64) + "}")
		req, _ := http.NewRequest("POST", "https://api.gotinder.com/user/ping", bytes.NewBuffer(respBody))
		req.Header.Set("X-Auth-Token", authToken)
		req.Header.Set("User-Agent", "Tinder Android Version 6.7.1")
		req.Header.Set("platform", "android")
		req.Header.Set("os-version", "23")
		req.Header.Set("Accept-Language", "en")
		req.Header.Set("app-version", "1983")
		req.Header.Set("host", "api.gotinder.com")
		req.Header.Set("Connection", "Keep-Alive")
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)

		if err != nil {
			fmt.Println("Error: " + err.Error())
		}

		defer resp.Body.Close()
		body, _ := ioutil.ReadAll(resp.Body)
		fmt.Println(string(body))

		if strings.Contains(string(body), "major position change") {
			fmt.Println("Moved too fast, reducing step size.")
			// undo step
			currLat -= stepSize * math.Cos(angle)
			currLon -= stepSize * math.Sin(angle)

			stepSize *= 0.75

			fmt.Println("Waiting twenty extra seconds before continuing...")
			time.Sleep(20000 * time.Millisecond)
		} else if strings.Contains(string(body), "position change") {
			fmt.Println("Didn't move enough, increasing step size.")

			stepSize *= 1.5
		}

		time.Sleep(1000 * time.Millisecond)
	}
}
