let request = require("request")
let moment = require("moment")


let express = require("express")
let app = express()
let http = require("http")
let path = require("path")
let fs = require("fs")

console.log("Firing up the Tindermatic...")

var headers = {
	"User-Agent": "Tinder Android Version 6.1.2",
	"platform": "android",
	"os-version": "23",
	"Accept-Language": "en",
	"app-version": "1910",
	"host": "api.gotinder.com",
	"Connection": "Keep-Alive",
	"X-Auth-Token": "",
}

function getMoreRecs() {
	request({
		url: "https://api.gotinder.com/recs/core?locale=en",
		headers: headers,
	}, (error, response, body) => {
		if(error) {
			console.log(error)
			return
		}

		let data = JSON.parse(body)

		for(let i = 0; i < data.results.length; i += 1) {
			evaluateRec(data.results[i].user)
		}

	})
}



function evaluateRec(rec) {
	if(rec.bio == "" && rec.schools.length == 0  && rec.jobs.length == 0) {
		console.log("[INFO] Possible spam bot, auto-swiping left.")
		console.log(rec)
		swipe(false, rec)

		return
	}

	console.log("[INFO] Leaving for you to evaluate: ")

	console.log("====")
	console.log(rec.name)
	console.log("Age: " + rec.birth_date)
	console.log(rec.bio)
	console.log(rec.schools)
	console.log(rec.jobs)


	console.log("====")

}

function swipe(like, rec) {
	let url = "https://api.gotinder.com/"

	if(like) {
		url += "like/"
	} else {
		url += "pass/"
	}

	url += rec._id

	request({
		url: url,
		headers: headers,
	}, (error, response, body) => {
		if(error) {
			console.log("[ERROR] Error swiping " + like + " on: ")
			console.log(rec)
			console.log(error)
			return
		}

		data = json.parse(body)

		if(data.match) {
			console.log("[INFO] You matched with this person!")
			console.log(rec)
		}

		if(data.likes_remaining == 0) {
			console.log("Out of likes.")
			process.exit(0)
		}
	})
}
