$(() => {
	let socket = io("/")
	let recs = {}
	let currentRec = {}
	let $currentRec = {}

	let blacklist = []
	let whitelist = []

	let likesUsed = 0

	let school = {}

	// kludgy way to avoid a race condition, fix later
	setTimeout(() => {
		socket.emit("recs")
	}, 500)

	socket.on("recs", (data) => {
		// append rec

		for(let i = 0; i < data.length; i += 1) {
			let rec = data[i].user
			recs[rec._id] = rec

			let $rec = $("#rec-prototype").clone()
			$rec.attr("id", rec._id)

			for(let p = 0; p < rec.photos.length; p += 1) {
				$rec.find(".rec-photos").append($(`<img class="rec-photo" src="${rec.photos[p].url}" />`))
			}

			for(let s = 0; s < rec.schools.length; s += 1) {
				if(rec.schools[s].id == school.id) {
					$rec.find(".rec-meta").append($(`<li class="good">School: ${rec.schools[s].name}</li>`))
				} else {
					$rec.find(".rec-meta").append($(`<li>School: ${rec.schools[s].name}</li>`))
				}
			}

			$rec.find(".rec-name").text(rec.name)

			if(rec.bio === "") {
				$rec.find(".rec-bio").addClass("bad").text("[NO BIO]")
			} else {
				// process bio
				let bioWords = rec.bio.split(/\s+/g)
				let bio = ""

				for(let w = 0; w < bioWords.length; w += 1) {
					console.log(bioWords[w])
					let wordMatched = false

					for(let wl = 0; wl < whitelist.length; wl += 1) {
						if(!wordMatched && bioWords[w].toLowerCase().includes(whitelist[wl].toLowerCase())) {
							console.log(bioWords[w] + " matched " + whitelist[wl])

							wordMatched = true

							bio += `<span class="good">${bioWords[w]} </span>`

							break
						}
					}

					for(let bl = 0; bl < blacklist.length; bl += 1) {
						if(!wordMatched && bioWords[w].toLowerCase().includes(blacklist[bl].toLowerCase())) {
							console.log(bioWords[w] + " matched " + blacklist[bl])

							wordMatched = true

							bio += `<span class="bad">${bioWords[w]} </span>`

							break
						}
					}

					if(!wordMatched) {
						bio += `${bioWords[w]} `
					}
				}


				$rec.find(".rec-bio").html(bio)

			}



			$rec.find(".rec-meta").append($(`<li>Age: ${moment(rec.birth_date).fromNow(true)}</li>`))
			$rec.find(".rec-meta").append($(`<li>Last ping: ${moment(rec.ping_time).fromNow()}</li>`))
			$rec.find(".rec-meta").append($(`<li>Distance: ${rec.distance_mi} miles</li>`))
			if(rec.spotify_theme_track) {
				$rec.find(".rec-meta").append($(`<li>Anthem: ${rec.spotify_theme_track.artists[0].name}: ${rec.spotify_theme_track.name}</li>`))
			}

			$rec.appendTo("#queue")
		}

		loadFromQueue()
	})

	socket.on("blacklist", (data) => {
		blacklist = data
	})

	socket.on("whitelist", (data) => {
		whitelist = data
	})

	socket.on("school", (data) => {
		school = data
	})

	socket.on("outOfLikes", () => {
		showMessage("You are out of likes!")
		alert("You are out of likes!")

		$("#auto-right").attr("checked", false)
	})

	socket.on("error", () => {
		showMessage("An error occurred. See console.")
	})

	socket.on("swipeSuccess", (data) => {
		let $rec = $("#" + data.rec._id)

		let $recState = $rec.find(".rec-state")

		if($recState.text() == "SWIPING") {
			if(data.like) {
				$recState.addClass("good").text("LIKE")

				likesUsed += 1
				$("#likes-used").text(likesUsed)
			} else {
				$recState.addClass("bad").text("PASS")
			}
		}
	})

	socket.on("match", (rec) => {
		let $rec = $("#" + rec._id)

		alert("You matched with " + rec.name + "!")

		$rec.find(".rec-state").addClass("good").text("MATCH")
	})


	// load next rec from queue, make it the current rec
	function loadFromQueue() {
		if($("#queue").find(".rec").length == 0) {
			socket.emit("recs")
			return
		}

		let $container = $("#container")
		let $rec = $("#queue").find(".rec").first()

		$currentRec = $rec
		currentRec = recs[$rec.attr("id")]

		$rec.appendTo($container)
		$container.animate(
			{
				scrollTop: $container[0].scrollHeight
			},
			200
		)

		console.log(currentRec)

		// check for spam
		if(currentRec.bio === "" && currentRec.schools.length == 0 && currentRec.jobs.length == 0) {
			console.log("Spam bot, swiping left:")
			console.log(currentRec)

			$rec.find(".rec-state").addClass("bad").text("SPAM")
			swipeLeft()
			return
		}

		if($("#auto-right").is(":checked")) {
			swipeRight()
		}
	}

	function swipeRight() {
		socket.emit("swipeRight", currentRec)

		loadFromQueue()
	}

	function swipeLeft() {
		socket.emit("swipeLeft", currentRec)

		loadFromQueue()
	}

	function showMessage(message) {
		let $message = $("#message-prototype").clone()

		$message.find(".message-content").text(message)

		let $container = $("#container")
		$message.appendTo($container)

		$container.animate(
			{
				scrollTop: $container[0].scrollHeight
			},
			200
		)
	}

	$(window).on("keydown", (ev) => {
		if(ev.which == 37) {
			swipeLeft()
		}

		if(ev.which == 39) {
			swipeRight()
		}
	})
})