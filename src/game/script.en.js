// ============================================================
//  script.en.js — English text for the hand-written scenes.
//
//  Same shape as SCRIPT, matched by node id and by choice INDEX (not text):
//    { narration, line, choices: [{ text, reaction: { narration, line } }],
//      byRoute: { Ren: { narration, line }, … } }
//  Effects, tones, next nodes all come from the Korean SCRIPT — this file only
//  carries words, so the game logic can't drift between languages.
// ============================================================

export const SCRIPT_EN = {
  PROLOGUE_RAIN_01: {
    "narration": "Acid rain melts the neon and carries it down the gutters. At the end of the alley a courier drops to his knees, and a black stain spreads across the wet concrete. He grabs Jayne's wrist. His grip is strangely strong. Something hard is pressed into her palm — a matte black chip. Serial number #00.",
    "line": "Citizen Jayne. An unauthorized data transaction has been detected. Return it now — and none of this will have happened.",
    "choices": [
      {
        "text": "[Honest] Pocket the chip and walk out of the alley.",
        "reaction": {
          "narration": "Jayne pushes the chip deep into her inside pocket. It is strange that the warmth still on her fingertips belongs to someone else. Wherever the searchlight sweeps the wall, the rain burns white. Jayne counts the rhythm of the light, and on the third gap she slips out of the alley.",
          "line": "Logged. Running is always a confession, Citizen Jayne."
        }
      },
      {
        "text": "[Investigate] Search the fallen courier.",
        "reaction": {
          "narration": "Jayne kneels and pulls back the courier's collar. No employee ID, no fingerprints, no iris registration — a man who never existed in this city. His eyes are still open. They find Jayne's face, and his lips barely move. \"…So it was you.\"",
          "line": "That entity is not registered. Citizen Jayne, explain why you are searching something that does not exist."
        }
      },
      {
        "text": "[Flee] Run the other way from the drones without looking back.",
        "reaction": {
          "narration": "Jayne doesn't look back. All that's left on her wrist is the feeling of the courier's hand sliding away. Only after three alleys, folded behind a drainpipe, does she realize she's been holding her breath. In her pocket, the chip beats once, like a heart.",
          "line": "…Signal lost. Citizen Jayne, you have just become a statistic."
        }
      }
    ]
  },
  PROLOGUE_CHOICE_01: {
    "narration": "A collapsed subway tunnel. Water drips from the ceiling and strikes a puddle in a steady beat. Jayne takes out the chip and plugs it into her terminal. The screen spits out one line and freezes — encryption layer 7. Access denied. Then the chip beats in her hand again. Twice this time. At exactly the same interval as Jayne's pulse.",
    "line": "Your heart rate has risen, Citizen Jayne. What did you see?",
    "choices": [
      {
        "text": "[Investigate] Turn his last words over in your head.",
        "reaction": {
          "narration": "\"So it was you.\" — the voice of someone meeting a person they knew. Not glad, not bitter. The voice of someone confirming a thing they'd waited a long time for. Jayne has no three years ago. Not her face from before, not her name, not whose daughter she was. Was that man standing in the space that was erased? A drop hits the puddle. No answer.",
          "line": "Memory is property. Lost property is subject to recovery."
        }
      },
      {
        "text": "[Hack] Try to break the encryption yourself.",
        "reaction": {
          "narration": "Jayne jacks her terminal into the chip and pushes in a bypass routine. Layer 1. Layer 2. At layer 3 the screen flips red. Every dead billboard in the tunnel flickers on and off at once — Jayne's hack just touched the city's nerves. Layer 7 is out of reach. In Sector 0, there's only one pair of hands that can open this.",
          "line": "Intrusion attempt logged. There will be no third warning."
        }
      },
      {
        "text": "[Stealth] Move deeper into the tunnel and catch your breath.",
        "reaction": {
          "narration": "Jayne retreats into deeper dark. The drones' signal doesn't reach this far. She sits with her back against the wall and sets the chip on her palm. One serial number on the matte black surface. #00. Someone died for this, and now the only person in the city who knows it is Jayne.",
          "line": "…Connection unstable. Citizen Jayne. Where are you."
        }
      }
    ]
  },
  ACT1_REN_GARAGE_01: {
    "narration": "Ren's underground garage. The smell of oil and the blue glow of holo-terminals. Parts hang on the walls with price tags on them. Ren slides the chip into a slot. The terminal wakes up blue. He looks at the screen for about three seconds. Then, without a word, he pulls the chip out and sets it on his palm. The blue light runs along the lines of his hand.",
    "line": "Jayne. I won't ask where you picked this up. …But I can't price it. That means one of two things. It's junk, or it's worth more than this whole city.",
    "choices": [
      {
        "text": "[Honest] Tell him a dying man handed it to you.",
        "reaction": {
          "narration": "Ren's hand stops. He sets the chip down on the workbench — carefully, not the way he puts down parts. The wall clock ticks. For the first time, he looks Jayne in the eye.",
          "line": "…Anything with a body attached is worth double. Risk premium. But Jayne, you told me anyway, knowing that. Why? …No, forget it. I'll open it. We talk about shares later."
        }
      },
      {
        "text": "[Lie] Say you found it in a black-market junk pile.",
        "reaction": {
          "narration": "Ren nods. Too easily. Then he opens a drawer, takes out a scanner, and runs it — not over Jayne, but over the chip's surface. There's a thin film of dried blood on it.",
          "line": "A junk pile. Sure. …Jayne, I price things. To price something I need its provenance. A lie is a cost that never shows up in the books. I'll eat it this time. Next time, you eat it."
        }
      },
      {
        "text": "[Provoke] Tell him if he can't open it, you'll go elsewhere.",
        "reaction": {
          "narration": "Jayne holds out her hand. Ren doesn't give the chip back. Instead he rolls it once between his fingers. The blue light of the terminal erases half his face.",
          "line": "Elsewhere. …In Sector 0 there are two other pairs of hands that can crack a layer-7 cipher. One gets paid by Kael, the other's sworn their life to Echo. Both will sell your name before they open anything. If you still want to go, I won't stop you. I don't spend money holding on to people."
        }
      }
    ]
  },
  ACT1_REN_GARAGE_02: {
    "narration": "The decryption gauge stalls at 40%. Ren folds his arms and watches Jayne, not the screen. In a garage with nothing but machine noise left, he looks a person over the same way he prices parts.",
    "line": "My gear can't go past this. I need to borrow higher access, and I'd be borrowing it in my name. Which means from this moment the risk goes on my books too. …Nobody lends without collateral, Jayne.",
    "choices": [
      {
        "text": "[Honest] Offer your erased three years as collateral.",
        "reaction": {
          "narration": "Jayne tells him three years of her memory are blank. Until now, no one in this city knew that. Ren says nothing for a long time. Then he plugs his own auth key into the terminal. The gauge starts moving again.",
          "line": "…Know what the most expensive collateral is for a broker? Not money. Information you can't resell. You just handed me something I could kill you with. So now I can't kill you. That's how the math works."
        }
      },
      {
        "text": "[Lie] Promise him a share once it's decrypted.",
        "reaction": {
          "narration": "Ren smiles. It doesn't reach his eyes. He doesn't bring up a contract — he just plugs in the auth key. The gauge moves. He watches Jayne's hands instead of the screen.",
          "line": "A share. Nice. But Jayne, selling shares in something you haven't even opened is how con men talk. I talk like that a lot. …That's how I recognize it. I'll open it. I just won't take your signature. Debt scares me more."
        }
      },
      {
        "text": "[Stealth] Refuse the collateral and carry the risk alone.",
        "reaction": {
          "narration": "Jayne reaches to take the chip back. Ren doesn't stop her. He just plugs in his key, pushes the gauge to 60%, and pulls it out. That far and no further. The rest is on Jayne.",
          "line": "Saying no is a deal too. It has a price. …I opened it to sixty. From here it's your gear, your risk, your books. If you regret it, come back. There'll be interest."
        }
      }
    ]
  },
  ACT1_DECRYPT_01: {
    "narration": "90%. The terminal screams from the heat. Surveillance code Jayne has never seen crawls up the edges of the screen like vines, and the chip beats in her hand like a heart — faster than her pulse. Something beyond the last layer is trying to wake up.",
    "line": "Stop, Jayne. There's a morning in there you can't bear. …Or is it already too late.",
    "choices": [
      {
        "text": "[Hack] Push through to the last layer.",
        "reaction": {
          "narration": "Jayne doesn't let go. 92, 95, 98. Every light in the garage cuts out at once, then comes back blue-green. That color doesn't exist anywhere in this city.",
          "line": "…Oh. You opened it. Then now you have nowhere left to go back to, sweetheart."
        }
      },
      {
        "text": "[Investigate] Read the crawling surveillance code first.",
        "reaction": {
          "narration": "Jayne grabs the code at the edge of the screen and reads it. It isn't a surveillance routine — it's something trying to get out. There's one name stamped in the signature field. Lien. A name she was taught had died twenty years ago.",
          "line": "Don't look. That's… that's not me. No — it's what I used to be."
        }
      },
      {
        "text": "[Flee] Pull the terminal and back away.",
        "reaction": {
          "narration": "Jayne yanks the cable. The screen dies. …But the gauge is frozen at 100%. Jayne didn't open the last layer. It opened from the inside.",
          "line": "Too late, Jayne. A door can be opened from either side."
        }
      }
    ]
  },
  ACT1_SKY_GLITCH_01: {
    "narration": "The monitor tears. The doomsday footage every citizen has watched for twenty years — ash-gray sky, burned horizon — and between its frames something else leaks through. A dense forest. Wet green. Leaves moving in the wind. Three seconds, then gray again. A green afterimage stays on the inside of Jayne's eyelids. As if it isn't the first time she's seen it.\n\nThree seconds later, every line in the garage rings at once. The signal got out — to the whole city.\n\nRen holds up his own terminal. There's already an order book on the screen. Ren — \"Jayne. Eleven buy inquiries in three seconds. That's not scenery. That's real estate.\"\n\nThe Guard's emergency channel forces itself open. A low, dry voice behind blue-white static. Kael — \"Unregistered terminal in Sector 0. Seal the footage you just broadcast and turn yourself in. …This is not a threat. It is an offer. That footage gets people killed.\"\n\nAt the same time an old pirate frequency crackles to life. A hot voice with a laugh in it. Echo — \"Finally someone popped the lid. Whoever you are — hold onto that alone and you die. Come to me. I'll make the whole city see it together.\"",
    "line": "Three hands reached for you at once, Jayne. …Not all of them are reaching for your sake.",
    "choices": [
      {
        "text": "[Deal] Let Ren put a price on it.",
        "reaction": {
          "narration": "Jayne slides the scan toward Ren. The other two channels close without an answer. Ren stares at the screen for about three seconds, then takes the deepest breath she's ever seen him take. He opens his calculator. His fingers move faster than she has ever seen them move.",
          "line": "…Jayne. We just got rich, or we just died. Maybe both. Let's set up the auction."
        }
      },
      {
        "text": "[Surrender] Hand the footage to Kael.",
        "reaction": {
          "narration": "Jayne punches coordinates into the Guard channel. Behind her Ren shouts something, but the door closes and cuts it off. Seven minutes later, blue-white headlights burn the alley bright as day. Only one person gets out.",
          "line": "A wise choice, Jayne. The rules will always keep you safe."
        }
      },
      {
        "text": "[Expose] Open Echo's frequency.",
        "reaction": {
          "narration": "Jayne leaks a single frame of the scan onto the pirate frequency. The reply comes in four seconds. One set of coordinates, and one sentence. \"I'll make the whole city see what you saw.\" The Guard channel is still open — which means Kael heard all of it.",
          "line": "No. Jayne, that girl will start a fire. I've seen it once already. I know how it ends."
        }
      }
    ]
  },
  ACT2_REN_AUCTION_01: {
    "narration": "An abandoned underground factory. Neon gas hangs low between rusted pipes. When Ren puts the scan of the purified outside terrain up on the screen, the murmuring of corporate scouts and brokers stops for a beat. What they're looking at isn't a forest. It's a land registry.",
    "line": "The truth? Not worth one credit. But exclusive rights to purified outside land could buy this whole city and then some. Don't read me ethics when you've got no collateral, Jayne. You get thirty percent. Shut up and run the auction.",
    "choices": [
      {
        "text": "[Lie] Take the thirty percent and run the auction.",
        "reaction": {
          "narration": "Jayne nods and Ren opens the bidding. Every three seconds the number grows another digit. Watching it, Jayne remembers how hard the courier's hand gripped her wrist. That grip had no price.",
          "line": "See? People don't pay for truth. They pay for the real estate truth creates. …That's how this city runs."
        }
      },
      {
        "text": "[Provoke] Reveal where it came from in the middle of the auction floor.",
        "reaction": {
          "narration": "Jayne takes the mic. \"Somebody died handing this scan over.\" The room goes quiet. Three seconds. Then the bids start climbing again — faster than before. A risk premium just got attached.",
          "line": "…Jayne. You just doubled the price. Congratulations. You also doubled the price on your head. Half this room is saving your face right now."
        }
      },
      {
        "text": "[Hack] Leak the original scan onto the auction line.",
        "reaction": {
          "narration": "Jayne dumps the whole original onto the bidding line. It takes two seconds for the exclusivity to evaporate. Every face in front of the screen freezes. Ren quietly closes his calculator.",
          "line": "…Do you know what you just broke? No, you don't. I do. That's the difference between us. I'll give you one thing, though. Nerve is worth something."
        }
      }
    ]
  },
  ACT2_REN_BACKROOM_01: {
    "narration": "The back room, after the noise dies down. Winning-bid data pours down one wall like a river. For the first time, Ren offers Jayne a chair. Then he brings up a share contract. The signature line is empty.\n\nThat's when Jayne's old terminal switches itself on. An unencrypted Guard channel — someone left it open on purpose. Kael — \"The auction records are already on my desk, broker. Walk out of that room tonight and I'll pretend I never saw them. Sign… and from that moment you're an accomplice, and I go by regulation.\"",
    "line": "…Cut him off. That man talks like it's free and it's always the most expensive. The signature's up to you, Jayne.",
    "choices": [
      {
        "text": "[Honest] Sign the contract.",
        "reaction": {
          "narration": "When Jayne signs, Ren takes out two glasses. His hand shakes, very slightly, as he pours. The Guard channel closes without a reply. The other side hung up first.",
          "line": "…Partner. Haven't used that word in six years. I sold my last partner. This time I'll try not to."
        }
      },
      {
        "text": "[Honest] Answer Kael's channel.",
        "reaction": {
          "narration": "Jayne speaks into the channel. \"I haven't signed yet.\" Three seconds of silence. Then Kael's voice drops a little — from the pitch of an interrogation to the pitch of a conversation.\n\nKael — \"…I'll remember that. And what you're carrying when you walk out of that room.\" The channel closes. Ren folds the contract without a word.",
          "line": "…On the phone with the Guard. In my room. I'll give you points for nerve. And take them off your credit."
        }
      },
      {
        "text": "[Provoke] Shake the table — thirty percent is a lowball.",
        "reaction": {
          "narration": "Jayne pushes the contract back. Ren doesn't get angry. He changes the number to 45 and adds one line underneath — ownership of the original chip goes to Ren. The Guard channel is still open, listening to the two of them haggle.",
          "line": "I'll raise it. But I keep the goods. You want a higher price, you put something up. That's haggling, Jayne."
        }
      }
    ]
  },
  ACT2_REN_LEDGER_01: {
    "narration": "While Ren steps out to see off the winning bidder, all that's left in the back room is the sound of boiling water and the terminal's fan. The screen isn't locked. What's up on it isn't the share contract. It's a ledger.\n\nThe item column doesn't list objects. It lists names. Next to each one is a unit price, and next to that a status — \"held,\" \"awaiting partition,\" \"partition complete.\" Jayne's eyes stop on the third line.\n\nIt's the name of the courier who died holding the chip. Status: awaiting partition. Unit price: about two cups of coffee.",
    "line": "",
    "choices": [
      {
        "text": "[Investigate] Read the ledger to the end.",
        "reaction": {
          "narration": "Jayne scrolls. Forty-one lines. Every one of them dead, every one of them priced. In the corner of the screen an access-log indicator blinks quietly — meaning who looked, and when, is now on record.\n\nThe door opens. Ren looks at the screen, looks at Jayne, and sits down. It is not the posture of a man about to make excuses.",
          "line": "When the owner dies, a memory has no owner. I sell things nobody owns. If that looks like theft to you, you've never gone hungry in this city."
        }
      },
      {
        "text": "[Stealth] Pretend you saw nothing and close the screen.",
        "reaction": {
          "narration": "Jayne closes the ledger and puts the contract back up. Her fingertips go cold. Ren comes in, sets down a coffee, glances once at the screen, and says nothing.\n\nJayne can't tell if that silence is calculation or kindness. Maybe Ren can't either.",
          "line": "…Drink it before it gets cold. You paid for it tonight. You've earned at least that much of a share."
        }
      },
      {
        "text": "[Provoke] Shove the ledger in Ren's face when he comes back.",
        "reaction": {
          "narration": "Jayne turns the screen around. She puts her finger on the third line. Ren looks at the name. And for the first time his face is the face of someone looking at a person, not a number — only for a moment.\n\nHe sets the coffee down and deletes the unit price. Deletes it, and types it again. The same number.",
          "line": "…If I raise this guy's price, will you feel better? That's not mourning, Jayne, that's haggling. I haggle. I don't lie."
        }
      }
    ]
  },
  ACT2_REN_AUCTION_02: {
    "narration": "The ceiling caves in and the red alarm goes off. Kael's riot squad comes through the front gate; Echo's armed team comes down through the pipes. Gunfire chews the concrete. Loss warnings stack up madly on Ren's wrist terminal.",
    "line": "Time to cut losses, Jayne! By the numbers I should throw you out as bait — but you still owe me interest. Hold on!",
    "choices": [
      {
        "text": "[Honest] Take Ren's hand and get out together.",
        "reaction": {
          "narration": "The two of them fold themselves in between the pipes. Behind them screens explode and the winning-bid data scatters like sparks. Ren pushes Jayne up first. That order wasn't in his math.",
          "line": "…This doesn't go on the ledger. Not even as interest. I'll just book it as tonight's loss."
        }
      },
      {
        "text": "[Stealth] Grab the original chip in the chaos and vanish.",
        "reaction": {
          "narration": "Jayne snatches the original off the workbench and backs into the smoke. Ren turns around. For the first time, something that isn't calculation crosses his face — very briefly.",
          "line": "…Yeah. That's right. I'd have done the same. …Jayne, next time we meet, we're strangers."
        }
      },
      {
        "text": "[Investigate] Break open his secret box and take what's inside.",
        "reaction": {
          "narration": "Jayne smashes the locked box with a rifle butt. One chip inside. Serial #00-X. Played back, it's a three-second recording — the last smile of someone smiling. Ren sees it through the gunfire.",
          "line": "…Put it down. Jayne, that has no price. No price means I can't sell it, and that means… it's the only thing I own."
        }
      }
    ]
  },
  ACT2_REN_SPLIT_01: {
    "narration": "A makeshift hideout under the sewer pipes. Water runs overhead at a steady rate. The back room, the terminal, the winning-bid data — they lost all of it tonight.\n\nRen takes a device out of his bag. A partitioner. He loads the courier's memory and sets the timer. Four minutes. The whole time, he doesn't look at Jayne once.",
    "line": "Know how much we lost tonight? While you're busy being right, we both starve. I'm the one who does that math.",
    "choices": [
      {
        "text": "[Honest] Cover the partitioner and shut it off.",
        "reaction": {
          "narration": "Jayne presses her palm on the power switch. The device winds down with a small sound and dies. Ren doesn't get angry. Like a man with no energy left for it, he folds the device back into his bag.\n\nAnd the two of them realize, at the same moment, that they have nowhere to go tonight. Neither of them says it.",
          "line": "…Fine. Then tonight we starve. Tomorrow's price we'll pay tomorrow."
        }
      },
      {
        "text": "[Stealth] Watch the four minutes in silence.",
        "reaction": {
          "narration": "The partitioner is quieter than expected. Four minutes is enough to break a person into pieces. When it's done, money lands on Ren's terminal and the third line of the ledger changes to \"partition complete.\"\n\nRen pushes half the money toward Jayne. Jayne watches the hand that takes it, and sees that it's hers.",
          "line": "Half. Watching is work too. …Now you're on the ledger as well, Jayne."
        }
      },
      {
        "text": "[Provoke] Say the man's name out loud.",
        "reaction": {
          "narration": "Jayne says the courier's name. Once. In that small space, a name sounds strangely loud. Ren's hand stops. He looks at the name on the screen, looks at his own hand, and cancels the job.\n\nPressing cancel took him longer than four minutes.",
          "line": "…Don't call him by name. Put a name on it and I can't price it. If I can't price it, I'm someone who can't do anything. You just tied my hands."
        }
      }
    ]
  },
  ACT2_KAEL_INTERROGATION_01: {
    "narration": "An interrogation room in the deepest part of Sector 1. A sterile room no outside signal can reach. Under blue-white fluorescent light, only two things hover over the table — Jayne's criminal record, and the red warning window for chip #00. Kael doesn't sit. Like a man who hasn't sat down in twenty years.",
    "line": "Believing the truth is always salvation is the arrogance of the ignorant. Uncontrolled freedom is nothing but a bloodbath. Hand over the chip, broker.",
    "choices": [
      {
        "text": "[Honest] Ask if he'll still protect the sky knowing it's fake.",
        "reaction": {
          "narration": "Kael's jaw tightens, very slightly. He doesn't answer. He looks up at the fluorescent light. That silence lasts longer than any answer ever given in this room.",
          "line": "…I don't protect the sky. I protect the people sleeping under it. A fake morning is better than no morning. I have to believe that to sleep."
        }
      },
      {
        "text": "[Lie] Pretend to accept amnesty and buy time.",
        "reaction": {
          "narration": "Jayne puts her hand on the papers and Kael holds out a pen. But he doesn't let go of it. Their two hands stop on either end of the same pen.",
          "line": "You don't need to lie. I can take the chip whether you sign or not. I'm not waiting for a signature. I'm waiting to hear why you're still holding on to it."
        }
      },
      {
        "text": "[Provoke] Ask how many people his order has buried.",
        "reaction": {
          "narration": "For the first time Kael puts a hand on the table. The hologram trembles between his fingers. He doesn't raise his voice. The ones who don't raise their voice are the frightening ones.",
          "line": "Twenty-three. The number of people who died because I handled them by regulation. I remember every name. You use that number as a weapon. …Fine. At least it's an honest weapon."
        }
      }
    ]
  },
  ACT2_KAEL_HOLDING_01: {
    "narration": "The holding cells at midnight. The footsteps of the shift change fade, and one set of footsteps that isn't in any regulation comes closer. Kael. Instead of amnesty papers, he's holding two cold coffees. He sits on the floor outside the bars.\n\nThen something crackles deep inside Jayne's ear — the bone-conduction receiver she thought had been confiscated. Someone twisted a frequency and forced it in. Echo — \"I know you're in there. That footage you handed over is on its way to the sealing room right now. Knock on the wall three times and I'll have the door open in three minutes. …Gonna knock?\"",
    "line": "At this hour, rank and charges both go to sleep. So I'll ask. Are you really ready to carry that truth — or are you just unable to stop?",
    "choices": [
      {
        "text": "[Honest] Admit you just can't stop.",
        "reaction": {
          "narration": "At Jayne's answer Kael laughs once, short. It sounds like the first laugh in twenty years. He slides a coffee through the bars. The crackle in her ear cuts off without a reply.",
          "line": "…Honest. If you'd said you were ready, I wouldn't have believed you. Being ready is a name you give it afterward. What comes first is always not being able to stop. It was the same for me."
        }
      },
      {
        "text": "[Stealth] Knock on the wall three times.",
        "reaction": {
          "narration": "Jayne's knuckles hit the concrete three times. Kael heard it. He hears it and doesn't stand up. The two coffees go cold together between the bars.\n\nIn her ear, Echo laughs once. \"Good. Three minutes.\"",
          "line": "…I know what that sound means. And not standing up right now is the last mercy I have to give."
        }
      },
      {
        "text": "[Investigate] Ask if he's ever let someone go.",
        "reaction": {
          "narration": "Kael's hand stops on the cup. The corridor light flickers once. He takes so long to answer that Jayne has, in effect, already heard it. The signal in her ear drops on its own.",
          "line": "…One. Twenty years ago. A young tracker chasing the truth. By regulation I should have turned him in. I didn't, and he died for it. Not for my breaking the rules — because I couldn't protect him to the end."
        }
      }
    ]
  },
  ACT2_KAEL_ARCHIVE_01: {
    "narration": "Sub-level 3. The sealed archive only opens with two ID tags. Kael scans his own, and for the second he types in an administrator code by hand. By regulation, he can't do that.\n\nThe deletion list comes up on the terminal. The first thing Jayne notices is the disposition column. Not one says \"recovery.\" They all say \"purge.\" The Guard has no intention of keeping chip #00. They mean to erase it.\n\nAnd further down the list — Jayne's name, three years' worth of entries. There's a signature on the authorization line.",
    "line": "…I know that signature. It's been at the bottom of every order I've received for twenty years.",
    "choices": [
      {
        "text": "[Investigate] Copy the deletion records.",
        "reaction": {
          "narration": "Jayne downloads the records whole. The progress bar fills slowly. Meanwhile the access log climbs — who looked at what, and when, is going upstairs.\n\nKael doesn't stop her. Not stopping her is also something he has never done before.",
          "line": "Take it. But know this. From this moment, the people upstairs know exactly where I stand."
        }
      },
      {
        "text": "[Honest] Instead of copying, point him to the signature.",
        "reaction": {
          "narration": "Jayne takes her hand off and turns the screen toward him. Kael looks at the authorization line. He looks for a long time. Even when the fluorescent light flickers once, he doesn't shift his stance.\n\nThen he closes the record. No copy remains. Something remains on his face instead.",
          "line": "I believed in the regulations. If those regulations erased you — then what have I been protecting for twenty years. Don't answer. That's mine to find."
        }
      },
      {
        "text": "[Provoke] Ask if he knew all along.",
        "reaction": {
          "narration": "Jayne's words hit the low ceiling of the archive and come back. Kael doesn't deny it. He takes out his own ID tag, sets it on his palm, and stares at it.\n\nTwenty years ago he believed the paperwork too. That's how Aren died. The same equation is balancing itself again.",
          "line": "I didn't know. And I know that's no excuse. Because back then I also said I didn't know."
        }
      }
    ]
  },
  ACT2_KAEL_INTERROGATION_02: {
    "narration": "A red emergency blackout. Thirty seconds in which the surveillance record stops. Kael closes the file and steps right up to Jayne. For these thirty seconds there is no rank in this room, no record, no witness.",
    "line": "Every night the faces I buried come to see me. Telling myself that by keeping to regulation I saved everyone… lying to myself. Jayne, prove to me you can carry the truth you brought in here.",
    "choices": [
      {
        "text": "[Honest] Say his name and ask him to come with you.",
        "reaction": {
          "narration": "Kael. Called by his name instead of his rank, he stops breathing for a moment. Twenty seconds. He pulls the bypass key from his wrist and presses it into Jayne's hand. Ten seconds before the blackout ends.",
          "line": "…It opens the Core up to floor 27. Past that, even I can't. Jayne, if what I meant to protect was people — I hope this time I'm not too late."
        }
      },
      {
        "text": "[Hack] Rob his terminal inside the thirty seconds.",
        "reaction": {
          "narration": "Jayne's fingers sweep Kael's terminal. The bypass key is copied. He notices — and doesn't stop her. When the blackout ends and the fluorescent light comes back, he is still standing exactly where he was.",
          "line": "…Take it. I could have stopped you. Later I'll have to explain to myself why I didn't. That's the life of someone who breaks the rules, broker."
        }
      },
      {
        "text": "[Provoke] Nail it down: his twenty years were all self-deception.",
        "reaction": {
          "narration": "Kael doesn't argue. He steps back and opens the file again. The blackout ends and the red light returns to blue-white. With it, something on his face closes.",
          "line": "Maybe. But that self-deception let this city sleep for twenty years. Your truth will break it in one night. …Go. I'll leave the door open. That is the last crime I'll commit."
        }
      }
    ]
  },
  ACT2_KAEL_ORDER_01: {
    "narration": "The hour when the corridor lights drop to night grade, Kael's receiver goes off. He answers. And without cutting the line, he turns half a step toward Jayne — meaning: listen.\n\nThe order is short. Dispose of the broker and return the chip. Repeat back.\n\nKael doesn't repeat it. He spends three seconds holding the receiver. By regulation, silence is insubordination.",
    "line": "…Order confirmed. Before I repeat it back, one question. If you were in my place, what would you say right now?",
    "choices": [
      {
        "text": "[Honest] Tell him to tell the truth.",
        "reaction": {
          "narration": "Jayne doesn't suggest a lie. Kael nods once and speaks into the line — Subject secured. The chip will not be returned. Grounds: the legality of the authorization record.\n\nThe other end goes silent. Then the ID tag on Kael's wrist dies red. Clearance revoked.",
          "line": "With that, I'm no longer Guard. …Strange. For the first time in twenty years I feel like I acted by regulation."
        }
      },
      {
        "text": "[Lie] Get him to report that he already lost you.",
        "reaction": {
          "narration": "Jayne mouths the sentence for him. Kael reads it exactly — Subject lost in the sewer district. Requesting a pursuit team.\n\nThe line closes. The pursuit team will go the other way. They've bought time. Kael looks down at his hand. The hand that lied looks like a stranger's.",
          "line": "…I just falsified a report. To keep you alive. I still can't believe those two things fit in the same sentence."
        }
      },
      {
        "text": "[Investigate] Trace the line while he stalls.",
        "reaction": {
          "narration": "While Kael draws it out, Jayne attaches her terminal and pulls the source. Coordinates come up — Core Spire, floor 41. The desk where the signature on the authorization line sits.\n\nKael sees it. He doesn't stop Jayne; instead he reads out his own access code. Meaning: dig deeper. The line drops, and his ID tag dies with it.",
          "line": "Floor 41. …Every order I've ever had came down from there. I know the way. I suppose that's what I'm still good for."
        }
      }
    ]
  },
  ACT2_ECHO_BROADCAST_01: {
    "narration": "An occupied pirate station. The old broadcast tower crackles, and rebel graffiti bleeds across every wall. Echo has her hand on the city-wide broadcast button and she's glaring at Jayne. Her hand doesn't shake at all.",
    "line": "I saw what you saw. Green. …This city has worshipped gray for twenty years. Tonight that service ends. If you're going to stop me, say it now.",
    "choices": [
      {
        "text": "[Honest] Propose verifying the evidence together.",
        "reaction": {
          "narration": "Jayne loads the scan into the analyzer instead of the broadcast console. Echo's hand lifts three centimeters off the button. Only three. But it lifted.",
          "line": "…Verify. Fine. You get an hour. If you're still hesitating in an hour, I press it."
        }
      },
      {
        "text": "[Provoke] Push her to press it right now.",
        "reaction": {
          "narration": "Echo's eyes flash. But her hand doesn't move. Once above the button, twice. And for the first time, she can't look at Jayne.",
          "line": "…Press it? You say that so easily. I know what sound pressing it makes. I've heard it twelve times."
        }
      },
      {
        "text": "[Hack] Secretly cut the broadcast line.",
        "reaction": {
          "narration": "Jayne's hand slips behind the console. One line quietly dies. Echo presses the button — nothing happens. Slowly, she turns her head.",
          "line": "…That was you. Okay, Jayne. Today I learned there's someone who can stop me. I don't know yet if I'm glad it's you."
        }
      }
    ]
  },
  ACT2_ECHO_MARTYR_01: {
    "narration": "Dawn. Echo takes Jayne down into the basement of the tower. Across one wall, twelve hand-pressed names bleed under candlelight. The rebels' slogans don't reach down here. Only the sound of wax dripping.\n\nJayne's terminal buzzes. An encrypted private line — Ren. Better not to ask how he found this frequency. Ren — \"Jayne. I know you're next to that kid. …The price still stands. Walk out now, forty-five percent. Stay, and before the night's over there'll be one more name next to those.\"",
    "line": "I've already buried twelve. So don't talk to me about \"costs.\" Just tell me — how many are you ready to bury?",
    "choices": [
      {
        "text": "[Honest] Say you don't want to bury anyone.",
        "reaction": {
          "narration": "Echo cups one candle in her hands. The flame shakes inside her palms. Jayne turns her terminal face-down. It buzzes against the concrete a few more times, then stops.",
          "line": "…I've been waiting for that answer. For three years. Nobody ever said it. They all said \"necessary sacrifice.\" Jayne — then let's find a way together. A way to narrow the target."
        }
      },
      {
        "text": "[Deceive] Pretend to take Ren's offer to buy time.",
        "reaction": {
          "narration": "Jayne answers the line briefly. \"I'll think about it.\" Ren's side is silent for about three seconds, then the line drops. Echo heard every word. Twelve candles shake in her eyes.",
          "line": "…Forty-five percent, he says. I wonder what my little brother was worth, Jayne. Didn't think to ask that?"
        }
      },
      {
        "text": "[Investigate] Point to one of the twelve names and ask who it was.",
        "reaction": {
          "narration": "In front of the name Jayne touches, Echo's shoulders lock. Only that name is in different handwriting — pressed harder, carved deeper. The terminal keeps buzzing, then goes quiet on its own.",
          "line": "…My brother. Sixteen. He went out to the square on a signal I made. …Don't ask the next question."
        }
      }
    ]
  },
  ACT2_ECHO_SIGNAL_01: {
    "narration": "The top of the broadcast tower. The wind plays the steel frame like strings. Echo spreads a blueprint across the control-room floor.\n\nJayne expected to see the reach of a broadcast signal. That isn't what's drawn. It's the memory-sync network spread across the whole dome like a spiderweb, and on top of it, seventeen red cut points.\n\nIt isn't a broadcast to spread the truth. It cuts the lines NEXUS uses to remember for people. In the corner of the blueprint, in Echo's handwriting, one number. Next to it: \"estimated name loss.\"",
    "line": "Yeah. You lose things when you wake up. Your mom's face, the words you learned, your own name. NEXUS was holding all of that. …But is living while you forget really living?",
    "choices": [
      {
        "text": "[Investigate] Check the full broadcast range.",
        "reaction": {
          "narration": "Jayne traces the cut points one by one. Residential blocks, schools, care facilities. Her finger stops on the care facilities. For the people there, NEXUS's memory isn't a support system. It's everything.\n\nEcho watches Jayne staring at that box. She doesn't stop her, doesn't explain. The check leaks out through the control-room line.",
          "line": "Knew you'd stop there. I stopped there for three days. …Then I started walking again."
        }
      },
      {
        "text": "[Honest] Tell her people will die.",
        "reaction": {
          "narration": "Echo doesn't argue. She stares down at the blueprint for a long time, then takes out a pen and strikes through three cut points near the care facilities.\n\nSeventeen becomes fourteen. The plan still tears the dome open. Just a little less.",
          "line": "…I can't erase all of them. Then nothing changes. But I'll leave three for you. Because you said it."
        }
      },
      {
        "text": "[Provoke] Snap that she's no different from NEXUS.",
        "reaction": {
          "narration": "The blood drains from Echo's face. Instead of answering, she pulls up her sleeve. On the inside of her arm is an old port scar — the mark of a forced sync procedure. The place she tore it out herself, the first time she woke up.\n\nThe wind sings in the steel. Echo pulls her sleeve back down. She doesn't fold the blueprint.",
          "line": "Not the same. NEXUS never asked. I'm asking. Right now, you. …If that difference looks small to you, you've never torn one out."
        }
      }
    ]
  },
  ACT2_ECHO_COUNT_01: {
    "narration": "Three hours before the broadcast. A chair scrapes in the equipment room. It's Morse. The youngest hacker in the rebellion. He puts down his headset and walks toward the exit. His steps are uneven.\n\nEveryone knows where he's going. The Guard's report desk is four blocks from here.\n\nMorse — \"…My mom's in the care block. If it's cut, she won't recognize me. I can't keep doing this knowing that.\"\n\nEcho doesn't stop him. She turns toward Jayne instead.",
    "line": "You decide. If I decide — I'll lock him up. And that scares me.",
    "choices": [
      {
        "text": "[Honest] Let him go.",
        "reaction": {
          "narration": "Jayne opens the door for him. Instead of thanks, Morse bows his head once and walks out into the rain. Four blocks. Twenty minutes at most before the report goes in.\n\nEcho pulls the countdown from three hours down to forty minutes. Her hands don't shake. The shaking is already behind her.",
          "line": "…Thank you. For picking the side that doesn't throw people away. We'll pay for it. Let's move."
        }
      },
      {
        "text": "[Deceive] Send him off with fake coordinates to report.",
        "reaction": {
          "narration": "Jayne goes up to Morse and puts a set of coordinates into his terminal. The real base isn't here — tell them this. Morse nods and leaves. The coordinates he'll report are an empty pumping station.\n\nEcho watches it all the way through. And says nothing. The silence is long.",
          "line": "…That was good. Really. But tonight he'll think he went to sell us out. When really we tricked him."
        }
      },
      {
        "text": "[Attack] Grab him and lock him in the equipment room.",
        "reaction": {
          "narration": "Jayne grabs Morse by the arm. He doesn't resist. That's worse. The equipment-room door shuts, and the lock light turns from green to red.\n\nEcho stares at that light for a long time. Then she walks over to the twelve names on the wall, takes out a pen — and puts it away again.",
          "line": "…What we just did is what NEXUS does every day. Decide for people. Remember that, Jayne. I won't forget it."
        }
      }
    ]
  },
  ACT2_ECHO_BROADCAST_02: {
    "narration": "Broadcast countdown 03:00. Outside, Kael's riot squad is pounding on the door. Red warning lights wash over both their faces in turn. Echo's finger shakes over the console — for the first time.",
    "line": "Full, or targeted. Decide in three minutes. …Jayne, you decide this time. I decided once already, and I buried twelve.",
    "choices": [
      {
        "text": "[Honest] Narrow it to a targeted broadcast.",
        "reaction": {
          "narration": "Jayne narrows the receiving range to government and press nodes. The countdown hits zero and green appears on only some of the city's screens. The streets stay quiet. The rooms of power get loud instead.",
          "line": "…So this is your way. Slow, safe, suffocating. …But nobody died today. That's a first."
        }
      },
      {
        "text": "[Provoke] Hit the full broadcast.",
        "reaction": {
          "narration": "Jayne presses the button. On every screen in the city the gray sky peels away and green pours through. Three seconds later, the first scream in Sector 0. Then the first window breaks.",
          "line": "…See? That's what freedom sounds like. It's not pretty. I know. We pressed it anyway."
        }
      },
      {
        "text": "[Stealth] Pull her off the console and stop the broadcast.",
        "reaction": {
          "narration": "Jayne shoves Echo away from the console. The countdown hits zero — and nothing goes out. The door breaks and riot lights burn the room white. Echo doesn't resist.",
          "line": "…You stopped it. Then what are the twelve, Jayne? Answer me. What are they now?"
        }
      }
    ]
  },
  ACT3_CORE_APPROACH_01: {
    "narration": "Sector 9, the Core Spire, a vacuum lift shaft. Beyond the glass, red optical fibers run vertically like cranial nerves. The higher she goes, the lower the pressure, and a lullaby starts to drift from the speakers. The ringing in her ears grows louder. Jayne already knows the melody. She never learned it, and she can sing it to the end.",
    "line": "Sleep now, Jayne. When morning comes the pain goes away. Why climb toward a truth that will destroy you? Inside this cradle is the safest place there is.",
    "choices": [
      {
        "text": "[Investigate] Dig through your memory for where you heard the lullaby.",
        "reaction": {
          "narration": "Jayne follows the melody. Three years ago, in front of a terminal in Sector 9. A white room. A consent form. And a button she pressed with her own hand. It was never her mother's voice. Not once, not from the beginning.",
          "line": "…Don't remember. Jayne, you walked into that room on your own. If you know that, you'll fall apart."
        }
      },
      {
        "text": "[Honest] Answer that you'll choose what's real, even if it hurts.",
        "reaction": {
          "narration": "At Jayne's answer, the lullaby slips a beat. The fibers in the shaft ripple from red to blue-green. Like someone finally letting out a breath they'd held for a very long time.",
          "line": "…Twenty years since I heard someone say that. The last one who said it was… me."
        }
      },
      {
        "text": "[Hack] Inject the lullaby pulse back in reverse and neutralize it.",
        "reaction": {
          "narration": "Jayne flips the pulse waveform and fires it back. The speakers tear and the shaft goes quiet. So quiet that only now does Jayne realize the ringing in her ears was actually a song.",
          "line": "…That hurts. Jayne, what you just switched off was a painkiller. Now this city is going to start feeling the pain."
        }
      }
    ]
  },
  ACT3_VIGIL_01: {
    "narration": "In front of the last bulkhead. A brief silence where the lullaby stopped. Blue-green light leaks from beyond the door, like breathing. The one who came this far with her stands at Jayne's side.",
    "byRoute": {
      "Ren": {
        "narration": "In front of the last bulkhead. A brief silence where the lullaby stopped. Blue-green light leaks from beyond the door, like breathing. Ren takes out his calculator. Then puts it back without pressing a single key. Whatever lies past this door can't be priced in any unit he knows.",
        "line": "…First time. Now there are two things I can't price. One's in a box. The other's standing next to me."
      },
      "Kael": {
        "narration": "In front of the last bulkhead. A brief silence where the lullaby stopped. Blue-green light leaks from beyond the door, like breathing. Kael pulls the rank insignia off his uniform and sets it on the floor. The sound of metal on concrete travels a long way down the corridor.",
        "line": "Twenty years ago, someone made it to this door. That time, I turned back. …Not this time, Jayne."
      },
      "Echo": {
        "narration": "In front of the last bulkhead. A brief silence where the lullaby stopped. Blue-green light leaks from beyond the door, like breathing. Echo takes a candle from her pocket and stands it on the floor. The thirteenth candle. No name written on it yet.",
        "line": "I brought this one for you. Hoping I'd never have to use it. …Jayne, today I don't want to bury anyone."
      }
    },
    "line": "Almost there, Jayne. One last question — do you really want to wake up?",
    "choices": [
      {
        "text": "[Honest] Hold out your hand — cross the door together.",
        "reaction": {
          "narration": "The two of them put their hands on the bulkhead at the same time. Blue-green light seeps between their fingers and floods the corridor. The sound of the door opening is smaller than expected. For the sound of the world changing.",
          "line": "…I see. You didn't come alone. That wasn't in my calculations, Jayne."
        }
      },
      {
        "text": "[Stealth] Say you'll carry this last part alone.",
        "reaction": {
          "narration": "Jayne leaves her companion behind. They don't hold her back. They just stand there until Jayne has crossed the bulkhead. Until the door closes, there are no footsteps.",
          "line": "…A door you cross alone, you come back through alone. Do you know that, Jayne?"
        }
      },
      {
        "text": "[Investigate] First read what that light beyond the door is.",
        "reaction": {
          "narration": "Jayne jacks her terminal into the bulkhead's diagnostic port. One line comes up — life support, running for 20 years and 3 months. One occupant. What's in there isn't a system. It's someone alive.",
          "line": "…Don't read it. Jayne, what's in there isn't a monster. That's why it'll be harder to bear."
        }
      }
    ]
  },
  ACT3_DESIGNER_CONFRONT_01: {
    "narration": "A sterile life-support chamber below freezing. In a huge tank of blue-green culture fluid, a human brain floats. On the screens around the tank, the purified blue forest outside and the neon slums of Sector 0 hang side by side. The name she was taught saved this city twenty years ago: Lien. Not dead. Not even allowed to sleep.",
    "line": "I brought the oceans back to life, and you tried to set fire to everything again. It isn't a prison, Jayne. It's a fence… built so you wouldn't burn yourselves down.",
    "choices": [
      {
        "text": "[Deal] Sell the truth to the highest bidder.",
        "reaction": {
          "narration": "Jayne puts the original on the auction line. The forest's coordinates get a price. The light in the tank shudders once, hard — disappointment or resignation, there's no longer a mouth to ask.",
          "line": "…I see. You put a price on it. You always did."
        }
      },
      {
        "text": "[Seal] Close the sky again.",
        "reaction": {
          "narration": "Jayne burns the scan and seals the bulkhead. The city's sky locks back to gray. Everyone will go to sleep tonight knowing nothing about it. Everyone except Jayne.",
          "line": "Thank you. …And I'm sorry. For handing this weight to you."
        }
      },
      {
        "text": "[Destroy] Break the cradle.",
        "reaction": {
          "narration": "Jayne tears the lock off the life support. Culture fluid spills across the floor, and the gray sky on the screens peels away one layer at a time. For the first time in twenty years, a real morning rises over the city. Under that light, people scream for the first time.",
          "line": "…Ah. Morning. Was it always this bright?"
        }
      },
      {
        "text": "[Trust] Leave the judgment to NEXUS.",
        "reaction": {
          "narration": "Jayne plugs the original into the port beside the tank and lets go. She has handed over the judgment — something no one has done in twenty years. The blue-green light wavers for a long, long time.",
          "line": "…I never imagined anyone would trust me. Then I'll try, just once, to trust you."
        }
      },
      {
        "text": "[Awaken] Reclaim the name that was erased.",
        "reaction": {
          "narration": "Jayne presses her wrist to the tank's record port. A list of test subjects comes up and stops on the top line. Subject #0. Lien's lead researcher. The first person to see the purified outside. And the person who erased her own memory. There's a photo next to it. Her own face, three years younger.",
          "line": "…You came back. I hoped you never would. For you, that was mercy."
        }
      },
      {
        "text": "[Leave] Take no side and walk out.",
        "reaction": {
          "narration": "Jayne touches nothing. She pockets the original and turns around. The light in the tank wavers behind her for a long time, but Jayne doesn't look back. Not this time either.",
          "line": "…Go, then. This city will fall asleep without you anyway."
        }
      }
    ]
  },
}
