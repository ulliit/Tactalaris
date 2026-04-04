//_260329 function Chess(){ // boardSize
//_260329
function Rules(){ // boardSize

    // covers the rules for Chess, Tactalaris and ChessXp
    // 100% hand-coded
    // Copyright (c) 2025 Ulrich Schwekendiek
    // license: MIT
    // https://opensource.org/license/mit
    // tactalaris.com
//_260329
    var self = this;

    if (typeof exports != 'undefined'){ // server side
		//_260329 //_191028
		// // the var statement is forbidden for the next declaration, since it would overwrite the global declaration of chessToolsClient on the client side, even if the if clause results to false.
		// // https://hashnode.com/post/in-javascript-is-it-wrong-to-declare-variables-within-an-if-block-cj0ctrgef004ffv53r4zruc8n

		// chessToolsClient = Object.create(require('../js/chesstoolsclient.js').chessToolsClient); //_191025
		//_260329 //_191028
		var logger = new (require('../js/log.js').logger);

    }
    else{

        var logger = new asLog(); //_190807

    }

    // all params are initialized by this.load

    // misc

    var invalidFen = "";

    // mode params

    var abilities = {};

    var boardSize = 0; // number of columns resp. rows

    var cSquares = {}; // squares that are affected by castling

    var files = [] // "a","b","c" ... "j"

    var squareNumbers = {}; // a10: 0, b10: 1, ... j1: 99

    var squares = []; // "a10","b10", ... "j1"
// console.dir(squareNumbers)
    var squaresCnt = 0; // number of squares, either 64 or 100.

    // game params

    var active = "";

    var capturedCnt = 0; // number of captured pieces. used when checking for insufficient material.
    var castlings = "";

    var epField1 = "";
    var epField2 = "";

    var fullmoveNr = 0;
    var halfmoveClock = 0;

    var lastRemainingPiece = ""; // last remaining piece on the board that is not a king. used when checking for insufficient material.

    var kingSquares = {k: "", K: ""};

    var position = {};

    // console.dir(abilities["r"]);

    this.fen = function(){
                                                         // logger.log({function: "chess100 fen", description: "start", data: {castlings: castlings, cSquares: cSquares}});
		var emptyFieldCounter = 0;
		var fen = "";

		for (var i=0; i<squaresCnt; i++){

		  if(position[squares[i]].piece == ""){

			  emptyFieldCounter = emptyFieldCounter + 1;

		  }
		  else{

			  if(emptyFieldCounter > 0){

				  fen = fen + emptyFieldCounter.toString();
				  emptyFieldCounter = 0;

			  }

			  fen = fen + position[squares[i]].piece;

		  }

		  if((i + 1) % boardSize === 0){

			  if(emptyFieldCounter > 0){

				  fen = fen + emptyFieldCounter.toString();

			  }

			  if(i != squaresCnt - 1){

				  emptyFieldCounter = 0;
				  fen = fen + "/";

			  }

		  }

		}

        // meta part

        fen = fen + " " + active;

        fen = fen + " ";

        if(castlings == ""){

            fen = fen + "-";

        }
        else{

		    if(castlings.indexOf(cSquares.w00[2] + " ") != -1){

		        fen = fen + "K";

		    }

		    if(castlings.indexOf(cSquares.w000[2] + " ") != -1){

		        fen = fen + "Q";

		    }

		    if(castlings.indexOf(cSquares.b00[2] + " ") != -1){

		        fen = fen + "k";

		    }

		    if(castlings.indexOf(cSquares.b000[2] + " ") != -1){

		        fen = fen + "q";

		    }

        }

        if(epField1 == ""){

            fen = fen + " -";

        }
        else{

            fen = fen + " " + epField1 + epField2;

        }

        fen = fen + " " + halfmoveClock.toString();

        fen = fen + " " + fullmoveNr.toString();
                                                                               // logger.log({function: "chess100 fen", description: "before return", data: {fen: fen}});
        return fen

    }

    this.inCheck = function(o){ // king, square
                                                                              // logger.log({function: "chess100 inCheck", description: "start", data: {options: o}});
        var o = o || {king: ((active == "w") ? "K" : "k"), square: ((active == "w") ? kingSquares["K"] : kingSquares["k"])};

        var controlledBy_ = position[o.square].controlledBy.split(" ");
        controlledBy_.pop();
       
        for (var i=0;i<controlledBy_.length;i++){

            // the following term uses a pattern with a leading " " and a "> 0" comparison because "pnbfrqk".indexOf("") = 0 and "pnbfrqk".indexOf("p") = 0.

            if((" pcznbfrqk".indexOf(position[controlledBy_[i]].piece) > 0 && o.king == "K") ||
               (" PCZNBFRQK".indexOf(position[controlledBy_[i]].piece) > 0 && o.king == "k") //_240422
              ){
                                                   // logger.log({function: "chess100 inCheck", description: "before returning true", data: {controlledBy_: position[controlledBy_[i]], options: o}});
                return true

            }

        }

        return false

    }

	function isAbsolutelyPinned(o){ // kSquare, square
                                                                                      // logger.log({function: "chess100 isAbsolutelyPinned", description: "start", data: {options: o}});
        // checks if a certain piece is pinned and the shielded piece is its king

		var controlledBy_ = position[o.square].controlledBy.split(" ");
		controlledBy_.pop();
                                                          // logger.log({function: "chess100 isAbsolutelyPinned", description: "after detecting controlledBy", data: {controlledBy: controlledBy_}});
		var pAbilities = []; // abilities of the potentially pinning piece
		var isPDirection = false; // check the up to four directions, in which bishop, rook and queen can fire

		for(var k=0;k<controlledBy_.length;k++){

			if(" BRQbrq".indexOf(position[controlledBy_[k]].piece) > 0){

			    // only bishop, rook and queen can pin
			    
				if((" BRQ".indexOf(position[controlledBy_[k]].piece) > 0 && position[o.kSquare].piece == "k") ||
				   (" brq".indexOf(position[controlledBy_[k]].piece) > 0 && position[o.kSquare].piece == "K")){

                    // enemy bishop, rook or queen found that controls the square the examined piece is located on. the piece is pinned if its king is located on a square behind, in the same direction the enemy piece fires.
			                                       
			        pAbilities = abilities[position[controlledBy_[k]].piece.toLowerCase()][controlledBy_[k]];
                                    // logger.log({function: "chess100 isAbsolutelyPinned", description: "potential pinner", data: {fen: self.fen(), pAbilities: pAbilities, squareParams: position[controlledBy_[k]], square: controlledBy_[k]}});
			        for(var l=0;l<pAbilities.length;l++){

                         // looping forward through the abilities of the enemy piece and not the squares it controls, since the enemy piece only controls the fields between itself and the examined piece. the friendly king would be located on a square behind the square of the examined piece, if applicable.

			             if(pAbilities[l] == ""){

			                 isPDirection = false;

			             }
			             else if(pAbilities[l] == o.square){

			                 isPDirection = true;

			             }
			             else if(position[pAbilities[l]].piece.toLowerCase() != "k" && isPDirection == true){

				             // a piece is located between the piece to be evaluated and its king - no pin

				             break

                         }
			             else if(pAbilities[l] == o.kSquare && isPDirection == true){

			                 // the friendly piece and its king are located on the same direction - friendly piece is pinned
                                                  // logger.log({function: "chess100 isAbsolutelyPinned", description: "before returning true", data: {fen: self.fen()}});
			                 return true


			             }

			        }

			    }

			}

		}
                                            // logger.log({function: "chess100 isAbsolutelyPinned", description: "before returning false", data: {fen: self.fen(), options: o}});
        return false

	}

    function updateSquares(o){ // causedByBlockedUpdate, previousPiece, sqFrom, sqTo //_201013
                             //_201012 logger.log({function: "chess100 update squares ", description: "start", data: {callstack: console.log(new Error().stack), piece: position[o.sqTo].piece, o: o}});
        // updates the controlled by and controls property of the squares (the elements of position[])
        // this is the only place where these properties are manipulated.
        // requires that the piece properties for the from and to square were updated before
        // a piece controls all squares where it could potentially beat another piece

        var piece = position[o.sqTo].piece.toLowerCase();

        if(o.causedByBlockedUpdate && " BRQbrq".indexOf(position[o.sqTo].piece) < 1){

            return

        }

        if(!!o.sqFrom){ // can be empty if the piece didn't move but was put on the board during a position setup
// console.log("weew")
            // piece = position[o.sqFrom].piece;

            var controls_ = position[o.sqFrom].controls.split(" ");
            controls_.pop(); // the split generates [" "] as last array element, which must be removed.
                                    // logger.log({function: "chess100 update squares ", description: "after controls_ init", data: {controls: position[o.sqFrom].controls, controls_: controls_}});
            for(i=0;i<controls_.length;i++){
// console.log("c: " + controls_[i])
                position[controls_[i]].controlledBy = position[controls_[i]].controlledBy.replace(o.sqFrom + " ", "")

            }

            position[o.sqFrom].controls = "";
            // position[o.sqFrom].piece = "";

        }

        position[o.sqTo].controls = "";
        //_201012
        if(!!o.previousPiece){

            // if a piece was beaten, update the fields it controlled

            var previousPiece = (o.previousPiece == "P") ? "P" : o.previousPiece.toLowerCase();
 // logger.log({function: "chess100 update squares ", description: "before checking abilities for beaten piece", data: {abilities: abilities[previousPiece][o.sqTo], previousPiece: previousPiece}});
            for(i=0;i<abilities[previousPiece][o.sqTo].length;i++){

                if(abilities[previousPiece][o.sqTo][i] != ""){

                    position[abilities[previousPiece][o.sqTo][i]].controlledBy = position[abilities[previousPiece][o.sqTo][i]].controlledBy.replace(o.sqTo + " ", "");

                }

            }

        }
        //_201012                                            
        if(piece == "p"){
         
            // check list special abilities:
            // moves only forward
            // beats differently
            // move abilities depend on the rank
            // no first and eight rank
            // promotion
            // en passant

            var pAbilities = abilities[position[o.sqTo].piece][o.sqTo];
// logger.log({function: "chess100 update squares ", description: "set controls for pawn field", data: {abilities: abilities["P"], piece: piece, sqTo: o.sqTo}});
            if(o.sqTo.substr(0,1) != files[0]){ // take account of border pawns. they can't beat to both sides

                position[pAbilities[0]].controlledBy += o.sqTo + " ";
                position[o.sqTo].controls += pAbilities[0] + " ";

            }

            if(o.sqTo.substr(0,1) != files[files.length-1]){ // see above

                position[pAbilities[pAbilities.length - 1]].controlledBy += o.sqTo + " ";
                position[o.sqTo].controls += pAbilities[pAbilities.length - 1] + " ";

            }      

        }
        else {

            piece = piece.toLowerCase();

		    //_240422 if(piece == "n" || piece == "f" || piece == "k"){
			if(piece == "c" || piece == "z" || piece == "n" || piece == "f" || piece == "k"){ //_240422

		        for(var i=0;i<abilities[piece][o.sqTo].length;i++){

		            // add flags

		            position[abilities[piece][o.sqTo][i]].controlledBy += o.sqTo + " ";
	 
		            // the controls property doesn't need to be set for these piece types, since the controlled fields always can be indentified using the corresponding abilities array, however for simplification ...

		            position[o.sqTo].controls += abilities[piece][o.sqTo][i] + " ";

		        }

		    }
		    else{
		                                                     // logger.log({function: "chess100.load ", description: "before checking pedestrian", data: {piece: piece}}) // {abilities: abilities[piece], piece: piece, position: position, sqTo: o.sqTo}});
		        // for the pedestrians directions can be blocked by other pieces, so this has to be checked

		        var blocked = false;

		        for(var i=0;i<abilities[piece][o.sqTo].length;i++){

		            if(abilities[piece][o.sqTo][i] != ""){

                        if(o.causedByBlockedUpdate){
        // logger.log({function: "chess100.load ", description: "checking pedestrian - delete old informations", data: {controls: position[o.sqTo].controls, abilities: abilities[piece][o.sqTo][i]}});
                            // delete old informations if a pedestrian didn't move, but is updated.

                            position[abilities[piece][o.sqTo][i]].controlledBy = position[abilities[piece][o.sqTo][i]].controlledBy.replace(o.sqTo + " ", "");
                            position[o.sqTo].controls = position[o.sqTo].controls.replace(abilities[piece][o.sqTo][i] + " ", "");

                        }

		                if(blocked == false){

							position[abilities[piece][o.sqTo][i]].controlledBy += o.sqTo + " ";
	                        position[o.sqTo].controls += abilities[piece][o.sqTo][i] + " ";
		               
							if(position[abilities[piece][o.sqTo][i]].piece != ""){

                                blocked = true;

                            }

		                }

					}
					else{

						blocked = false;

					}

		        }

            }

        }

        if(!!o.sqFrom){
                                           // logger.log({function: "chess100 updateSquares ", description: "updating blocked", data: {}});
		    // update blocked flags for pedestrians that control the from or the to sqare

		    var sqToCB_ = position[o.sqTo].controlledBy.split(" ");
            sqToCB_.pop();

		    if(sqToCB_.length > 0){
                                                                   // logger.log({function: "chess100 updateSquares ", description: "updating blocked", data: {sqToCB_: sqToCB_}});
		        for(i=0;i<sqToCB_.length;i++){

                    if(sqToCB_[i] != o.sqFrom){

		                updateSquares({sqTo: sqToCB_[i], causedByBlockedUpdate: true})

                    }

		        }

		    }

			var sqFromCB_ = position[o.sqFrom].controlledBy.split(" ");
            sqFromCB_.pop();
                                                             // logger.log({function: "chess100 updateSquares ", description: "updating blocked fro sqFrom", data: {sqFromCB_: sqFromCB_}});
			if(sqFromCB_.length > 0){

			    for(i=0;i<sqFromCB_.length;i++){

			        updateSquares({sqTo: sqFromCB_[i], causedByBlockedUpdate: true})

			    }

			}

        }
        
    }

    this.inCheckmate = function(){
                                                                       // logger.log({function: "chess100 inCheckmate", description: "start", data: {}});
        var king = (active == "w") ? "K" : "k";
        var square = (active == "w") ? kingSquares["K"] : kingSquares["k"];
        //_210428
        // detect how man pieces give check and note them

        var controlledBy_ = position[square].controlledBy.split(" ");
        controlledBy_.pop();
                                                                    // logger.log({function: "chess100 inCheckmate", description: "detect check giving pieces", data: {}});
        var enemy = "";
        var enemy2 = ""; // in case of double check

        for(var i=0;i<controlledBy_.length;i++){

            //_240422 if((" PNBFRQK".indexOf(position[controlledBy_[i]].piece) > 0 && active == "b") || (" pnbfrqk".indexOf(position[controlledBy_[i]].piece) > 0 && active == "w")){

	        if((" PCZNBFRQK".indexOf(position[controlledBy_[i]].piece) > 0 && active == "b") ||
	           (" pcznbfrqk".indexOf(position[controlledBy_[i]].piece) > 0 && active == "w")){ //_240422
						  
                // if the controller is an enemy piece

                if(enemy != ""){

                    // second check giving enemy piece found

                    enemy2 = controlledBy_[i];

                }else{

                    enemy = controlledBy_[i];

                }

            }

        }

        if(enemy == ""){

            // no check, no mate

            return false

        }
                                      // logger.log({function: "chess100 inCheckmate", description: "after detecting enemies", data: {enemy: enemy, enemy2: enemy2}});
        // all neighbouring fields (nf) are in check or occupied by a friendly piece?

        for(var i=0;i<abilities[king.toLowerCase()][square].length;i++){

            var ability = abilities[king.toLowerCase()][square][i];
                                   // logger.log({function: "chess100 inCheckmate", description: "looping through neighbouring squares", data: {indexOfB: " pnbfrqk".indexOf(position[ability].piece), indexOfW: " PNBFRQK".indexOf(position[ability].piece), square: ability, squareParams: position[ability]}});
            if(!(self.inCheck({king: king, square: ability}))){

                // if the nf is not in check

                //_240422 if(((" PNBFRQK".indexOf(position[ability].piece) < 1 && active == "w") || (" pnbfrqk".indexOf(position[ability].piece) < 1 && active == "b"))){
                if(((" PCZNBFRQK".indexOf(position[ability].piece) < 1 && active == "w") || (" pcznbfrqk".indexOf(position[ability].piece) < 1 && active == "b"))){ //_240422

                    // if the nf is not occupied by a friendly piece

                    if(" BRQbrq".indexOf(position[enemy].piece) > 0){

                        // the following special case applies only to the pedestrians

				        var abilitiesEnemy = abilities[position[enemy].piece.toLowerCase()][enemy];

				        for(j=0;j<abilitiesEnemy.length;j++){

						    if(abilitiesEnemy[j] == ability){
	// logger.log({function: "chess100 inCheckmate", description: "check neighbouring fields", data: {abilitiesEnemy: abilitiesEnemy, ability: ability}});
	                            //_220207
	                            // if the nf is not in check, but part of the abilities of the check giving piece, there is a blocker
	                            
	                            for(k=(j-1);k>=0;k--){
	                                          
	       	                         if(position[abilitiesEnemy[k]].piece == king){
	       	                         
	       	                             //  if the king is the blocker it is a special case: the field behind the king, from the perspective of the check giving piece. mate then.
	       	                             
	       	                             break;
	       	                             
	       	                         }else if(position[abilitiesEnemy[k]].piece != king){
	       	                         
	       	                             // if the blocker is another piece, it's not mate. as far as I grasp it, this case is only possible for the queen and only if this piece gives a diagonal check to the king with no squares between and the king. for instance 1r6/p4P1p/4P2k/3p4/1q4p1/KN6/P4R2/5R2 w - - 0 1. not possible for double checks.
	                                 
	                                     return false;
	                                 
	                                 }
	                            
	                            }
	                            //_220207	                            
				                //_220207 // if the nf is not in check, but part of the abilities of the check giving piece, it is a special case: the field behind the king, from the perspective of the check giving piece
				                break;

						    }

				        }

				        if(j == abilitiesEnemy.length){

		                    if(enemy2 != ""){

		                        // if it is a double check, do the check for the second check giving piece as well

								var abilitiesEnemy2 = abilities[position[enemy2].piece.toLowerCase()][enemy2];

								for(j=0;j<abilitiesEnemy2.length;j++){

									if(abilitiesEnemy2[j] == ability){

								        break;

									}

								}

		                        if(j == abilitiesEnemy2.length){
	// logger.log({function: "chess100 inCheckmate", description: "looping through neighbouring squares - before returning false", data: {abilitiesEnemy2_j: abilitiesEnemy2[j], enemyPiece: position[enemy2].piece, square: ability, squareParams: position[ability]}});
		                            return false

		                        }

		                    }
		                    else{
	// logger.log({function: "chess100 inCheckmate", description: "looping through neighbouring squares - before returning false", data: {abilitiesEnemy_j: abilitiesEnemy[j], enemyPiece: position[enemy].piece, square: ability, squareParams: position[ability]}});
				                return false

		                    }

				        }

                    }else{

                        return false

                    }

                }

            }

        }

        //  check for double check. that would mean checkmate, since the king has no squares left (see above).

        if(enemy2 != ""){

            return true

        }

        // evaluate if the piece that gives check can be beaten

	    var controlledByBy_ = position[enemy].controlledBy.split(" ");
	    controlledByBy_.pop();

	    for(var j=0;j<controlledByBy_.length;j++){

	   		if((" PCZNBFRQ".indexOf(position[controlledByBy_[j]].piece) > 0 && active == "w") ||
	   		   (" pcznbfrq".indexOf(position[controlledByBy_[j]].piece) > 0 && active == "b")){ //_240422

                // finding a piece that could beat the attacker is not enough. it must be checked that this piece isn't absolutely pinned.

                if(isAbsolutelyPinned({kSquare: square, square: controlledByBy_[j]}) == false){

                    return false

                }

		    }

	    }
                                                                                  // logger.log({function: "chess100 inCheckmate", description: "check for blockers", data: {}}); //_210506
        // evaluate if the piece that gives check can be blocked

        if(" BRQbrq".indexOf(position[enemy].piece) > 0){

			var controls_ = position[enemy].controls.split(" ");
			controls_.pop();
                                                                  // logger.log({function: "chess100 inCheckmate", description: "check for BRQbrq blocks", data: {controls_: controls_}});
			var aDirection = [];

			// collect all fields where a blocker could appear

			var abilitiesEnemy = abilities[position[enemy].piece.toLowerCase()][enemy];

			for(var i=0;i<abilitiesEnemy.length;i++){

				if(abilitiesEnemy[i] == ""){

				   aDirection = [];

				}
				else if(abilitiesEnemy[i] == square){

				   break;

				}
				else{

				   aDirection.push(abilitiesEnemy[i]);

				}

			}

			// evaluate the potentially blocking pieces

			var controlledBy_ = [];
                                                        // logger.log({function: "chess100 inCheckmate", description: "check for possible blocks", data: {position: position}}) //_210506
			for(i=0;i<aDirection.length;i++){

				controlledBy_ = position[aDirection[i]].controlledBy.split(" ");
				controlledBy_.pop();

				for(j=0;j<controlledBy_.length;j++){

					if((" CZNBFRQ".indexOf(position[controlledBy_[j]].piece) > 0 && active == "w") ||
					   (" cznbfrq".indexOf(position[controlledBy_[j]].piece) > 0 && active == "b")){ //_240422
					   
	                    if(isAbsolutelyPinned({kSquare: square, square: controlledBy_[j]}) == false){
        // logger.log({function: "chess100 inCheckmate", description: "blocker found", data: {square: aDirection[i], squareData: position[aDirection[i]], piece: position[controlledBy_[j]].piece}})
	                        // if the defender is not pinned and can block the attacker, its not mate

	                        return false;

	                    }

                    }

				}

                // check for pawns that not control the field but could move forward to block the attacking piece
                                         // logger.log({function: "chess100 inCheckmate", description: "check for possible pawn blocks", data: {aDirection: aDirection}});
                var index = -1;
                var direction = (active == "w" ? 1 : -1);
                var pawn = (active == "w" ? "P" : "p");
                var squareToTest = "";

				for(j=1;j<4;j++){

                    index = squareNumbers[aDirection[i]] + (boardSize * direction * j);

                    if(index > -1 && index < squaresCnt - 1){

		                squareToTest = squares[squareNumbers[aDirection[i]] + (boardSize * direction * j)];
// logger.log({function: "chess100 inCheckmate", description: "check for possible pawn blocks", data: {abilities: abilities[pawn][squareToTest], Direction: aDirection[i], index:  index, j: j, squareNumber: 
		                if(position[squareToTest].piece != pawn){

		                    // potential pawn movement is blocked by another piece

		                    break

		                }
		                else{

		                    for(k=1;k<abilities[pawn][squareToTest].length - 1;k++){

			                    if(abilities[pawn][squareToTest][k] == aDirection[i]){

			                        // a pawn was found that could move to the blocking square

			                        if(isAbsolutelyPinned({kSquare: square, square: squareToTest}) == false){

			                            // if this pawn isn't pinned, it's not mate

			                            return false

			                        }

			                    }

		                    }

		                    break

		                }

                    }

				}                    

			}

        }

        return true

    }

    this.insufficientMaterial = function(){ //_210922
                                                // logger.log({function: "chess100.insufficientMaterial", description: "start", data: {capturedCnt: capturedCnt}}); //_210922
        // check for insufficient material

        if(capturedCnt >= (boardSize * 4 - 3)){

            if(capturedCnt == (boardSize * 4 - 2)){

                // bare kings left

                return true

            }
            else{

                if(lastRemainingPiece == ""){

		            for(var i=0;i<squaresCnt;i++){

		                if(position[squares[i]].piece != "" && position[squares[i]].piece.toLowerCase() != "k"){

		                    lastRemainingPiece = position[squares[i]].piece;
		                    break;

		                }

		            }

                }

                if(lastRemainingPiece.toLowerCase() == "b" || lastRemainingPiece.toLowerCase() == "n"){

                    return true

                }

            }

        }
        
        return false
        
    }
    
    this.fiftyMoves = function(){ //_210922

        // check for 50 move rule violation
                                 // logger.log({function: "chess100.fiftyMoves", description: "before checking halfmove clock", data: {halfmoveClock: halfmoveClock}}); //_210922
        //_250927 return (halfmoveClock >= 50)
        return (halfmoveClock >= 100) //_250927

    }

//////    this.inThreefold(){

//////       // tbd
//////       // since this is checked by moves.js, it is not needed so far.

//////    }

    this.inStalemate = function(){
                                                                                    // logger.log({function: "chess100 inStalemate ", description: "start", data: {fen: self.fen()}});
        var controls = [];
        var kSquare = (active == "w") ? kingSquares["K"] : kingSquares["k"];
        var pAbilities = [];
        var piece = "";

        for(var i=0;i<squaresCnt;i++){

            piece = position[squares[i]].piece;

	   		if((" PCZNBFRQK".indexOf(piece) > 0 && active == "w") ||
	   		   (" pcznbfrqk".indexOf(piece) > 0 && active == "b")){ //_240422
                                                                   // logger.log({function: "chess100 inStalemate ", description: "piece found", data: {}});
                controls_ = position[squares[i]].controls.split(" ");
                controls_.pop();

                for(var j=0;j<controls_.length;j++){
                                                                   // logger.log({function: "chess100 inStalemate ", description: "checking controlled squares", data: {}});
					if(" PCZNBFRQK".indexOf(piece) != " PCZNBFRQK".indexOf(position[controls_[j]].piece) ||
	                   " pcznbfrqk".indexOf(piece) != " pcznbfrqK".indexOf(position[controls_[j]].piece)
                       ){
                                                                   // logger.log({function: "chess100 inStalemate ", description: "no friendly piece on controlled square", data: {}});
                        // if the controlled square isn't blocked by a friendly piece

                        if(piece.toLowerCase() == "k"){

				            if(self.inCheck({king: piece, square: controls_[j]}) == false){

                                // king can move - no stalemate

				                return false

				            }

                        }
                        else if(isAbsolutelyPinned({kSquare: kSquare, square: squares[i]}) == false){

	                        return false

                        }

                    }

                }
                                                               // logger.log({function: "chess100 inStalemate ", description: "vertical pawn movement?", data: {square: squares[i]}});
                if(piece.toLowerCase() == "p"){

                    // check possible vertical movements of a certain pawn

                    pAbilities = abilities[piece][squares[i]];

                    for(var k=1;k<pAbilities.length-1;k++){

                        if(position[pAbilities[k]].piece == ""){

                            // possible square is not blocked by a piece

                            if(isAbsolutelyPinned({kSquare: kSquare, square: squares[i]}) == false){

								// pawn can move

								return false

                            }
                        
                        }

                    }

                }

            }

        }

        return true

    }

	this.legalMoves = function(o){ // square
		
		// returns all legal moves for a given fen and target square
		// the kiss solution that works without any preselection
		
		var fen = self.fen();
		var legals = [];
		
		for (var i=0;i<squares.length;i++){

            self.load({fen: fen}); // must be reloaded, since moving changes the state of the class instance
			let retVal = self.move({from: squares[i], to: o.square})
			
			if(retVal.from != undefined){
				
				legals.push(retVal);
				legals[legals.length-1].fen = self.fen();
				
			}	
				
		}

		return legals
		
	}

    this.load = function(o){ // fen
                                                                         //_200920 logger.log({function: "chess100.load ", description: "start", data: {o: o}}); //_200603
        // resets the instance to it's initial state and loads a position

        // mode dependent initializations and validity check (to be extended and tested)

        var fen_ = o.fen.split("/");
                                                          // logger.log({function: "chess100.load ", description: "before initializing fixed vars", data: {fen_Length: fen_.length}}); //_191106
        boardSize = fen_.length;
        squaresCnt = boardSize * boardSize;

        fenInvalid = "";
        var msgInvalid = "Invalid fen - ";

        if(boardSize != 8 && boardSize != 10){

			fenInvalid = "board has " & boardSize & " ranks."
			return msgInvalid + fenInvalid;

        }

        if(o.fen.indexOf("k") == -1 ||
           o.fen.indexOf("K") == -1){
                                                                                                          // console.log("Invalid fen - pawns on the first and/or last rank.")
            fenInvalid = "position needs two kings."
            return msgInvalid + fenInvalid;

        }

        if(fen_[0].indexOf("p") != -1 ||
           fen_[0].indexOf("P") != -1 ||
           fen_[boardSize - 1].indexOf("p") != -1 ||
           fen_[boardSize - 1].indexOf("P") != -1){
                                                                                                          // console.log("Invalid fen - pawns on the first and/or last rank.")
            fenInvalid = "pawns on the first and/or last rank."
            return msgInvalid + fenInvalid;

        }
                                                   
        if(fen_.length == 8){

            abilities = abilities64;
            files = files64;
            squareNumbers = squareNumbers64;
            squares = squares64;
			cSquares = cSquares64;

        }
        else{

            abilities = abilities100;
            files = files100;
            squareNumbers = squareNumbers100;
            squares = squares100;
	    cSquares = cSquares100; // this can still change as a result of the validation test for the castling flags, see further below //_240809

        }

        // game dependent initializations

        active = "";

        capturedCnt = boardSize * 4;

        castlings = "";

        epField1 = "";
        epField2 = "";

        fullmoveNr = 0;
        halfmoveClock = 0;

        lastRemainingPiece = "";

        kingSquares = {k: "", K: ""};
                                                                         // logger.log({function: "chess100.load ", description: "before clearing position", data: {position: position}});
        position = {};

             // logger.log({function: "chess100.load ", description: "after initializing squares and squareNumbers", data: {squaresCnt: squaresCnt, squares: squares, squareNumbers: squareNumbers}});
        // load new position

        //_260329 var pos = chessToolsClient.fenToArray({addMeta: true, fen: o.fen})
        var pos = self.fenToArray({addMeta: true, fen: o.fen}) //_260329
                                                                         // logger.log({function: "chess100.load ", description: "after initializing pos", data: {pos: pos, squaresCnt: squaresCnt}});
        for (var i=0;i<squaresCnt;i++){

             position[squares[i]] = {controlledBy: "", controls: "", piece: pos[i]};

			 if(pos[i].toLowerCase() == "k"){

			     kingSquares[pos[i]] = squares[i];

			 }

             if(pos[i] != ""){

                 capturedCnt = capturedCnt - 1;

             }      

        }
                                                                          // logger.log({function: "chess100.load ", description: "before updating squares", data: {position: position}}); //_191106
        for (var i=0;i<squaresCnt;i++){

             if(position[squares[i]].piece != ""){

                 updateSquares({sqTo: squares[i]})

             }

        }
                                      
        // handle meta part

	    // init color to move

	    active = pos[squaresCnt];
	    
	function initCastlings(){
	
	    castlings = "";

            // init castling flags

	    if(pos[squaresCnt + 1] == "K"){

	        castlings += (cSquares.w00[2] + " ");

	    }

	    if(pos[squaresCnt + 2] == "Q"){

	        castlings += (cSquares.w000[2] + " ");

	    }

	    if(pos[squaresCnt + 3] == "k"){

	        castlings += (cSquares.b00[2] + " ");

	    }

	    if(pos[squaresCnt + 4] == "q"){

	        castlings += (cSquares.b000[2] + " ");

	    }
	    
	}
	
	initCastlings(); //_240809
                                           // logger.log({function: "chess100.load ", description: "after setting castlings", data: {castlings: castlings}});
        epField1 = pos[squaresCnt + 5].substring(0,2);

		if(pos[squaresCnt + 5].length == 4){

            epField2 = pos[squaresCnt + 5].substr(2,4);

		}

	    // halfmoveClock

	    halfmoveClock = parseInt(pos[squaresCnt + 6], 10);

	    // fullmoveNr

	    fullmoveNr = parseInt(pos[squaresCnt + 7], 10);
                                          // logger.log({function: "chess100.load ", description: "after setting position", data: {epField1: epField1}});

        // make some validations after the position has been loaded

        function checkCastlings(){ //_240809
        
                // check if the placement of kings & rooks corressponds with the castling flags set //_240809

		if(kingSquares.K != cSquares.w00[0] && (castlings.indexOf(cSquares.w00[2] + " ") != -1 || castlings.indexOf(cSquares.w000[2] + " ") != -1)){

		    fenInvalid = "white castling possibilities were enabled but the white king is not on its initial square."
		    return msgInvalid + fenInvalid;

		}

		if(kingSquares.k != cSquares.b00[0] && (castlings.indexOf(cSquares.b00[2] + " ") != -1 || castlings.indexOf(cSquares.b000[2] + " ") != -1)){

		    fenInvalid = "black castling possibilities were enabled but the black king is not on its initial square."
		    return msgInvalid + fenInvalid;

		}

		if(castlings.indexOf(cSquares.w00[2] + " ") != -1 && position[cSquares.w00[cSquares.w00.length - 1]].piece != "R"){ //_240809

		    fenInvalid = "short castling for white was enabled but the rook is not on its initial square."
		    return msgInvalid + fenInvalid;

		}

		if(castlings.indexOf(cSquares.w000[2] + " ") != -1 && position[cSquares.w000[cSquares.w000.length - 1]].piece != "R"){ //_240809

		    fenInvalid = "long castling for white was enabled but the rook is not on its initial square."
		    return msgInvalid + fenInvalid;

		}

		if(castlings.indexOf(cSquares.b00[2] + " ") != -1 && position[cSquares.b00[cSquares.b00.length - 1]].piece != "r"){ //_240809

		    fenInvalid = "short castling for black was enabled but the rook is not on its initial square."
		    return msgInvalid + fenInvalid;

		}

		if(castlings.indexOf(cSquares.b000[2] + " ") != -1 && position[cSquares.b000[cSquares.b000.length - 1]].piece != "r"){ //_240809

		    fenInvalid = "long castling for black was enabled but the rook is not on its initial square."
		    return msgInvalid + fenInvalid;

		}

		return "ok"
		
	}

	var castlingsCheckMsg = checkCastlings();

	if(castlingsCheckMsg != "ok" && boardSize == 10){
	                 // console.log("castlinglong")
	    // if the "rooks on b & i" castling pattern didn't pass the test for 10x10, try "rooks on a & j"
	
	    fenInvalid = "";
	    
	    cSquares = cSquares100Long;
	                             // console.log("square: " + cSquares.b00[cSquares.b00.length - 1])
	    initCastlings();

	    castlingsCheckMsg = checkCastlings();
	    
	    if(castlingsCheckMsg != "ok"){
	    
	         return castlingsCheckMsg
	    
	    }
	
	}

    }

    this.move = function(o){ // from, san, to, promotion
                                                 // logger.log({function: "chess100.move ", description: "start", data: {fen: self.fen(), options: o, position: position}}); //_200603 //_201013
        if(fenInvalid != ""){

            // if the position is invalid, it's an invalid move anyway

            return {err: "Invalid position - " + fenInvalid}

        }

        if(o.san != undefined){

            o = self.sanToFromTo({san: o.san});

        }

        if(position[o.from] == undefined){

            // invalid from square

            return {err: "Source square is invalid."}

        }

        var piece = position[o.from].piece;
        //_240925
        if(piece == ""){
        
            return {err: "No piece on the source square."}
        
        }
        //_240925
        var retVal = {

            // optional:
            // ambiguous,
            // capture,
            // castling,
		    from: o.from,
            piece: piece,
		    to: o.to

        };

	    if((" PCZNBFRQK".indexOf(piece) > 0 && active == "b") ||
	       (" pcznbfrqk".indexOf(piece) > 0 && active == "w")){ //_240422
            // wrong color moved

            return {err: "Wrong color moved."}

        }

        if(piece.toLowerCase() == "p" && 
           position[o.from].controls.indexOf(o.to + " ") != -1 && 
           position[o.to].piece == "" &&
           o.to != epField1 && 
           o.to != epField2){

			return {err: "The pawn controls the square but there is no enemy piece to beat on it."}

        }
  
        var previousValues = {
            castlings: castlings,
            epField1: epField1,
            epField2: epField2,
            kingSquares: JSON.parse(JSON.stringify(kingSquares)),
            position: JSON.parse(JSON.stringify(position)) // kiss solution. always saving the complete position just to be ready for the rare case of restore after an illegal move seems to be
                                                           // a bit of performance waste, but developing a restore solution using updateSquares would be not trivial, especially when a beaten piece 
                                                           // has to be placed again. //_201013
        }

        epField1 = "";
        epField2 = "";
                                                 // logger.log({function: "chess100.move ", description: "before checking square controls", data: {}});
        if(position[o.from].controls.indexOf(o.to + " ") == -1){

            // target square is not controlled by the piece to be moved

            if(piece.toLowerCase() == "p"){

                // check pawn squares where moving but not beating is allowed

                var pAbilities = abilities[piece][o.from];

                var checkCnt = 0;

                var firstValidIndex = (o.from.substr(0,1) != files[0] ? 1 : 0); // take account of border pawns. they can't beat to both sides
                var firstInvalidIndex = pAbilities.length - (o.from.substr(0,1) != files[files.length-1] ? 1 : 0); // see above
                                        // logger.log({function: "chess100.move ", description: "check vertical pawn move", data: {firstValidIndex: firstValidIndex, firstInvalidIndex: firstInvalidIndex, pAbilities: pAbilities}});
                for(var i=firstValidIndex;i<firstInvalidIndex;i++){

                    if(position[pAbilities[i]].piece != ""){

                        return {err: "Pawn move requested, but a needed square is blocked by a piece."}

                    }

                    checkCnt += 1;

                    if(pAbilities[i] == o.to){

                        // valid pawn square

                        if((squareNumbers[o.to] < boardSize || squareNumbers[o.to] > (squaresCnt - boardSize -1)) && o.promotion == undefined){

                            return {err: "A pawn moved to the last rank but wasn't promoted."}

                        }

                        var direction = (active == "w" ? -1 : 1);

                        if(boardSize == 8){

		                    if (checkCnt == 2){

		                        // pawn moved two squares forward - registering the ep field

		                        epField1 = squares[squareNumbers[o.from] + 8 * direction];

		                    }

                        }
                        else{

		                    if (checkCnt == 2 || checkCnt == 3){

		                        // pawn moved more than one square forward - registering ep field(s)

		                        epField1 = squares[squareNumbers[o.from] + 10 * direction];

		                        if(checkCnt == 3){

		                           epField2 = squares[squareNumbers[o.from] + 20 * direction];

		                        }

		                    }

                        }

                        break;

                    }

                }

                if(i == firstInvalidIndex){

                    return {err: "Pawn move requested, but the target square is invalid."}

                }

            }
            else if(piece.toLowerCase() == "k"){
                                                                 // logger.log({function: "chess100.move ", description: "before checking castling move", data: {castlings: castlings, to: o.to}});
                // check for a possible castling

                // the requirement "king and rook on their initial squares when castling is enabled" is checked by the .load function

                if(castlings.indexOf(o.to + " ") == -1){
                                                                                             // logger.log({function: "chess100.move ", description: "missing castling possibility", data: {}});
                    return {err: "Castling requested, but the target square is invalid."}

                }
                else if((o.to == cSquares.w00[2] && (position[cSquares.w00[1]].piece != "" || position[cSquares.w00[2]].piece != "" || (position[cSquares.w00[3]].piece != "" && cSquares.w00.length == 5))) ||
                        (o.to == cSquares.b00[2] && (position[cSquares.b00[1]].piece != "" || position[cSquares.b00[2]].piece != "" || (position[cSquares.b00[3]].piece != "" && cSquares.b00.length == 5))) ||
                        (o.to == cSquares.w000[2] && (position[cSquares.w000[1]].piece != "" || position[cSquares.w000[2]].piece != "" || position[cSquares.w000[3]].piece != "" || (position[cSquares.w000[4]].piece != "" && cSquares.w000.length == 6))) ||
                        (o.to == cSquares.b000[2] && (position[cSquares.b000[1]].piece != "" || position[cSquares.b000[2]].piece != "" || position[cSquares.b000[3]].piece != "" || (position[cSquares.b000[4]].piece != "" && cSquares.b000.length == 6)))
                    ){
                                                                            // logger.log({function: "chess100.move ", description: "missing castling requirements", data: {}});
                    return {err: "Castling requested, but one of the needed squares is occupied by a piece."}

                }
                else if((o.to == cSquares.w00[2] && (self.inCheck({king: piece, square: cSquares.w00[2]}) || self.inCheck({king: piece, square: cSquares.w00[1]}) || self.inCheck({king: piece, square: cSquares.w00[0]}))) ||
                       (o.to == cSquares.b00[2] && (self.inCheck({king: piece, square: cSquares.b00[2]}) || self.inCheck({king: piece, square: cSquares.b00[1]}) || self.inCheck({king: piece, square: cSquares.b00[0]}))) ||
                       (o.to == cSquares.w000[2] && (self.inCheck({king: piece, square: cSquares.w000[2]}) || self.inCheck({king: piece, square: cSquares.w000[1]}) || self.inCheck({king: piece, square: cSquares.w000[0]}))) ||
                       (o.to == cSquares.b000[2] && (self.inCheck({king: piece, square: cSquares.b000[2]}) || self.inCheck({king: piece, square: cSquares.b000[1]}) || self.inCheck({king: piece, square: cSquares.b000[0]})))
                    ){
                                                                            // logger.log({function: "chess100.move ", description: "missing castling requirements", data: {}});
                    return {err: "Castling requested, but the king is or would be in check."}

                }
                else{

                    // if the castling is valid, place the rook
                    // the king move is considered as a normal piece move and the placement is done at the end of this function

                    if(o.to == cSquares.w00[2]){

                        position[cSquares.w00[1]].piece = "R";
                        position[cSquares.w00[cSquares.w00.length-1]].piece = ""; //_240809
                        updateSquares({sqFrom: cSquares.w00[cSquares.w00.length-1], sqTo: cSquares.w00[1]});
                        retVal.castling = "O-O";

                    }
                    else if(o.to == cSquares.b00[2]){

                        position[cSquares.b00[1]].piece = "r";
                        position[cSquares.b00[cSquares.b00.length-1]].piece = "";
                        updateSquares({sqFrom: cSquares.b00[cSquares.b00.length-1], sqTo: cSquares.b00[1]});
                        retVal.castling = "O-O";

                    }
                    if(o.to == cSquares.w000[2]){

                        position[cSquares.w000[1]].piece = "R";
                        position[cSquares.w000[cSquares.w000.length-1]].piece = ""; //_240809
                        updateSquares({sqFrom: cSquares.w000[cSquares.w000.length-1], sqTo: cSquares.w000[1]});
                        retVal.castling = "O-O-O";

                    }
                    if(o.to == cSquares.b000[2]){

                        position[cSquares.b000[1]].piece = "r";
                        position[cSquares.b000[cSquares.b000.length-1]].piece = ""; //_240809
                        updateSquares({sqFrom: cSquares.b000[cSquares.b000.length-1], sqTo: cSquares.b000[1]});
                        retVal.castling = "O-O-O";

                    }

                }

            }
            else{

		        return {err: "Target square is invalid."}

            }

        }
                     // logger.log({function: "chess100.move ", description: "before checking for friendly piece block", data: {from_piece: position[o.from].piece, to_piece: position[o.to].piece}});
		if(position[o.to].piece != "" &&
	       ((" PCZNBFRQK".indexOf(piece) > 0 && " PCZNBFRQK".indexOf(position[o.to].piece) > 0) ||
	        (" pcznbfrqk".indexOf(piece) > 0 && " pcznbfrqk".indexOf(position[o.to].piece) > 0))){
				
            return {err: "Target square is blocked by a friendly piece."}

        }
                                     // logger.log({function: "chess100.move ", description: "before adjusting castling flags", data: {castlings: castlings, piece: piece, cSquares: cSquares}});
        // adjust castling flags, if applicable

        if(castlings != ""){

		    if(piece == "K"){

		        castlings = castlings.replace(cSquares.w000[2] + " ", "");
		        castlings = castlings.replace(cSquares.w00[2] + " ", "");

		    }

		    if(piece == "k"){

		        castlings = castlings.replace(cSquares.b000[2] + " ", "");
		        castlings = castlings.replace(cSquares.b00[2] + " ", "");

		    }

            // rook has moved

		    if(piece == "R"){

                //_240809 if(o.from == cSquares.w000[4]){
                if(o.from == cSquares.w000[cSquares.w000.length - 1]){ //_240809

                    castlings = castlings.replace(cSquares.w000[2] + " ", "");

                }

                //_240809 if(o.from == cSquares.w00[3]){
                if(o.from == cSquares.w00[cSquares.w00.length - 1]){ //_240809

                    castlings = castlings.replace(cSquares.w00[2] + " ", "");

                }

		    }

		    if(piece == "r"){

                //_240809 if(o.from == cSquares.b000[4]){
                if(o.from == cSquares.b000[cSquares.b000.length - 1]){ //_240809

                    castlings = castlings.replace(cSquares.b000[2] + " ", "");

                }

                //_240809 if(o.from == cSquares.b00[3]){
                if(o.from == cSquares.b00[cSquares.b00.length - 1]){ //_240809

                    castlings = castlings.replace(cSquares.b00[2] + " ", "");

                }

		    }

            // rook was beaten

		    if(position[o.to].piece == "R"){

                //_240809 if(o.to == cSquares.w000[4]){
                if(o.to == cSquares.w000[cSquares.w000.length - 1]){ //_240809

                    castlings = castlings.replace(cSquares.w000[2] + " ", "");

                }

                //_240809 if(o.to == cSquares.w00[3]){
                if(o.to == cSquares.w00[cSquares.w00.length - 1]){ //_240809

                    castlings = castlings.replace(cSquares.w00[2] + " ", "");

                }

		    }

		    if(position[o.to].piece == "r"){

                //_240809 if(o.to == cSquares.b000[4]){
                if(o.to == cSquares.b000[cSquares.b000.length - 1]){ //_240809

                    castlings = castlings.replace(cSquares.b000[2] + " ", "");

                }

                //_240809 if(o.to == cSquares.b00[3]){
                if(o.to == cSquares.b00[cSquares.b00.length - 1]){ //_240809

                    castlings = castlings.replace(cSquares.b00[2] + " ", "");

                }

		    }
                                           // logger.log({function: "chess100.move ", description: "after adjusting castling flags", data: {castlings: castlings, piece: piece, cSquares: cSquares}});
        }

        // handle promotions

        if(o.promotion != undefined){

            if("pP".indexOf(piece) == -1){

                return {err: "Promotion requested, but it's not a pawn that has been moved."}

            }

            if(!((piece == "P" && squareNumbers[o.to] < boardSize) || (piece == "p" && squareNumbers[o.to] > (squaresCnt - boardSize - 1)))){

                // if the piece is not a pawn or the rank is invalid

                return {err: "Promotion requested, but the target square is not on the first or last rank."}

            }

            piece = (active == "w" ? o.promotion.toUpperCase() : o.promotion.toLowerCase());

            // return success()

        }


        if(piece.toLowerCase() == "k"){

            kingSquares[piece] = o.to;

        }

        // if applicable, detect the piece that was beaten
        
        var previousPiece = position[o.to].piece;

        // update position

	    position[o.to].piece = piece;
	    position[o.from].piece = "";
                                      // logger.log({function: "chess100.move ", description: "before handling ep capture", data: {ep1: epField1, ep2: epField2, piece: piece}});
        if(piece.toLowerCase() == "p" && (o.to == previousValues.epField1 || o.to == previousValues.epField2)){

            // handle en passant capture

            var beatenByEpSquare = squares[squareNumbers[o.to] + boardSize * ((previousValues.epField2 != "" && o.to == previousValues.epField1) ? 2 : 1) * (piece == "p" ? -1 : 1)]; //_201021
            previousPiece = position[beatenByEpSquare].piece; //_200722
            previousValues.beatenByEp = {piece: position[beatenByEpSquare].piece, square: beatenByEpSquare}
            position[beatenByEpSquare].piece = "";
                     // logger.log({function: "chess100.move ", description: "after handling ep capture", data: {beatenByEp: previousValues.beatenByEp, beatenByEpSquare: beatenByEpSquare}}); //_201021
        }
	                                            // logger.log({function: "chess100.move ", description: "before updating squares"});
        updateSquares({previousPiece: previousPiece, sqFrom: o.from, sqTo: o.to});
	        // logger.log({function: "chess100.move ", description: "after updating squares", data: {active: active, con1: (active == "w" && self.inCheck({king: "K", square: kingSquares["K"]})), con2: (active == "b" && self.inCheck({king: "k", square: kingSquares["k"]})), kingSquares: kingSquares}})
        if((active == "w" && self.inCheck({king: "K", square: kingSquares["K"]})) ||
           (active == "b" && self.inCheck({king: "k", square: kingSquares["k"]})) == true){

            // if in the resulting position the side that has moved would be in check, reset the position to the previous state

            if(o.promotion != undefined){

                if(active == "w"){

                    piece = "P";

                }
                else{

                    piece = "p";

                }

            }

            castlings = previousValues.castlings,
            epField1 = previousValues.epField1,
            epField2 = previousValues.epField2,
            kingSquares = JSON.parse(JSON.stringify(previousValues.kingSquares))
            position = JSON.parse(JSON.stringify(previousValues.position)) //_201013

            return {err: "Active color has moved, but is still in check."}

        }

        // check if the move is ambiguous

        var controlledBy_ = position[o.to].controlledBy.split(" ");
        controlledBy_.pop();

        for(i=0;i<controlledBy_.length;i++){

            if(position[controlledBy_[i]].piece == retVal.piece){ //_200603
                                  // logger.log({function: "chess100.move ", description: "is it ambiguous", data: {piece: piece, previousPiece: previousPiece}})
                if(!(retVal.piece.toLowerCase() == "p" && previousPiece == "")){

                    // if the piece is not a pawn that moved forward on a field that is controlled by neighbouring friendly pawns.

                    if(isAbsolutelyPinned({kSquare: (active == "w" ? kingSquares["K"] : kingSquares["k"]), square: controlledBy_[i]}) == false){

                        // if the twin piece isn't absolutely pinned.
				        // https://chess.stackexchange.com/questions/1864/is-this-case-considered-an-ambiguity-or-not

                        retVal.ambiguous = true;

                    }

                }

            }

        }

        if(active == "w"){

            active = "b";

        }
        else{

            active = "w";
            fullmoveNr += 1;

        }
                            // logger.log({function: "chess100.move ", description: "before cheking halfmoveclock", data: {hmc: halfmoveClock, piece: piece, previousPiece: previousPiece}}); //_200603
        if(retVal.piece.toLowerCase() == "p" || previousPiece != ""){ //_200603

            halfmoveClock = 0;

        }
        else{

            halfmoveClock += 1;

        }

        if(previousPiece != ""){

            capturedCnt += 1;
            retVal.capture = true;

        }

                                                    // logger.log({function: "chess100.move ", description: "before return", data: {castlings: castlings, sqTo: o.to, sqToParams: position[o.to]}});

        // move was successful - return move data

	    return retVal

    }

    this.position = function(){

        return position

    }
    //_211231
	this.possibleEpSquares = function(){
	
	    // detects all possible en passant squares for a given position

		var possibleEpSquares = [];
	// console.log("active: " + active)
		if(active == "b"){

			for(var i=4;i<(boardSize == 10 ? 8 : 5);i++){
			
			    for(var j=0;j<boardSize;j++){

					if(position[files[j] + i].piece == "P"){
					    
					    let epSquares = "";
					    
						if(j==0){

							if(position[files[j+1] + i].piece == "p"){

							    epSquares = files[j] + (i - 1);

							}

							if(i == 5 && position[files[j+1] + (i-1)].piece == "p"){

							    epSquares = files[j] + (i - 2) + epSquares;

							}
							
					    }

						if(j == (boardSize-1)){

							if(position[files[j-1] + i].piece == "p"){

							    epSquares = files[j] + (i - 1);
							  
							}

							if(i == 5 && position[files[j-1] + (i-1)].piece == "p"){

							    epSquares = files[j] + (i - 2) + epSquares;

							}

						}

						if(j>0 && j<(boardSize-1)){

							if(position[files[j+1] + i].piece == "p" ||  position[files[j-1] + i].piece == "p"){

							    epSquares = files[j] + (i - 1);

							}

							if(i == 5 && (position[files[j+1] + (i-1)].piece == "p" ||  position[files[j-1] + (i-1)].piece == "p")){

							    epSquares = files[j] + (i - 2) + epSquares;

							}
		       				
		       		    }
		       		    
		       		    if(epSquares != ""){
		       		    
		       		        possibleEpSquares.push(epSquares);
		       		    
		       		    }
		       		    
		       		}
									   
		        }
		    
		    }
        
        }else{

			for(var i=7;i>(boardSize == 10 ? 3 : 6);i--){
			
				for(var j=0;j<boardSize;j++){
			    // console.log(JSON.stringify(files))
					if(position[files[j] + i].piece == "p"){
					// console.log("ep pawn to beat: " & position[files[j] + i])
					    let epSquares = "";
					    
						if(j==0){

							if(position[files[j+1] + i].piece == "P"){

								epSquares = files[j] + (i + 1);

							}

							if(i == 6 && position[files[j+1] + (i+1)].piece == "P"){

								epSquares = files[j] + (i + 2) + epSquares;

							}
							
						}

						if(j==(boardSize-1)){

							if(position[files[j-1] + i].piece == "P"){

							    epSquares = files[j] + (i + 1);
							  
							}

							if(i == 6 && position[files[j-1] + (i+1)].piece == "P"){

								epSquares = files[j] + (i + 2) + epSquares;

							}

						}

						if(j>0 && j<(boardSize-1)){

							if(position[files[j+1] + i].piece == "P" ||  position[files[j-1] + i].piece == "P"){

								epSquares = files[j] + (i + 1);

							}

							if(i == 6 && (position[files[j+1] + (i+1)].piece == "P" ||  position[files[j-1] + (i+1)].piece == "P")){

								epSquares = files[j] + (i + 2) + epSquares;

							}
			   				
			   		    }
			   		    
			   		    if(epSquares != ""){
			   		    
			   		        possibleEpSquares.push(epSquares);
			   		    
			   		    }
			   		    
			   		}
									   
			    }
			
			}     
        
        }
        
        return possibleEpSquares
    
    }
    //_211231
    this.sanToFromTo = function(o){ // san
                                                                                                         // console.log(new Error().stack);
		// converts a move from san notation to from: ... to: notation
		// san examples: e4, exd4, Nfd4, Nfxd4+, Nxd4, Nd4+, Nd4#, O-O, O-O-O, b8=Q, b8=Q+, axb8=Q, axb8=Q+

		// if the active color castled, the transformation is simple

		if(o.san.indexOf("O-O-O") != -1){

		   return {from: cSquares[active + "000"][0], to: cSquares[active + "000"][2]}

		}

		if(o.san.indexOf("O-O") != -1){

		   return {from: cSquares[active + "00"][0], to: cSquares[active + "00"][2]}

		}

		// otherwise the params must be evaluated by analyzing san and position

		// detecting piece

		var ambiguous = "";
		var piece = o.san.substr(0,1);

		if("CZNBFRQK".indexOf(piece) == -1){ //_240422

		   // piece is a pawn

		   piece = "P";

		}

		// detecting the target square

        var san_ = o.san.split("");
		var sqTo = "";
                                                                   // logger.log({function: "chess100.sanToFromTo  ", description: "before looping for target", data: {san: san_}});
		for(var i=san_.length-1;i>=0;i--){
                                                                   // logger.log({function: "chess100.sanToFromTo  ", description: "detecting target", data: {san: san_}});
		   if("abcdefghij1234567890".indexOf(san_[i]) != -1){ //_191209
                                                                                    //_191209 if("abcdefghi1234567890".indexOf(san_[i]) != -1){
			  if((sqTo.length == 2 && sqTo != 10) || sqTo.length == 3){

				  if("abcdefghij1234567890".indexOf(san_[i]) != -1){ //_191209
                                                                                     //_191209 if("abcdefghi1234567890".indexOf(san_[i]) != -1){
				      // ambiguous move, e.g. the f in Nfd4
                      // or pawn beat, e.g. the e in exd4

				      ambiguous = san_[i];
				      break

				  }

			  }
			  else{

				  sqTo = san_[i] + sqTo;

			  }

		   }

		}

// logger.log({function: "chess100.sanToFromTo  ", description: "after analyzing san", data: {ambiguous: ambiguous, controlledBy_: controlledBy_, fen: self.fen(), san: o.san, sqTo: sqTo}});                   
		// detecting the source square

		var sqFrom = "";

		var controlledBy_ = position[sqTo].controlledBy.split(" ");
		controlledBy_.pop();
                             // logger.log({function: "chess100.sanToFromTo  ", description: "before detecting source", data: {ambiguous: ambiguous, controlledBy_: controlledBy_, fen: self.fen(), san: o.san, sqTo: sqTo}});
		for(i=0;i<controlledBy_.length;i++){

		   if(position[controlledBy_[i]].piece.toUpperCase() == piece){

               if((" PCZNBFRQK".indexOf(position[controlledBy_[i]].piece) > 0 && active == "w") || (" pcznbfrqk".indexOf(position[controlledBy_[i]].piece) > 0 && active == "b")){
				   
				   if(ambiguous == "" || (ambiguous != "" && controlledBy_[i].indexOf(ambiguous) != -1)){

                       if(!(ambiguous == "" && piece == "P")){

                           // if ! a pawn moved and pawn(s) control the target square, but no piece was beaten (then a pawn moved forward, see below)
						   
						   sqFrom = controlledBy_[i];
                           //_240131
						   if(ambiguous == ""){
							   
							   let pieceFound = false;
							   
							   for(var j=0;j<controlledBy_.length;j++){
								   
								   if(position[controlledBy_[j]].piece == position[controlledBy_[i]].piece){
								   
								       if(pieceFound == false){
								       	
									       pieceFound = true;
										
								       }else{

										   // if the san notation wasn't ambiguous but the piece exists nevertheless twice in the controlledBy string. this can happen if one of both pieces is absolutely pinned.
						   	
									       if(isAbsolutelyPinned({kSquare: (active == "w" ? kingSquares["K"] : kingSquares["k"]), square: controlledBy_[i]}) == true){
						       	
										       sqFrom = "";
								
									       }								       	

								       }

								   }
								   
							   }					
							
						   }
						   
					       if(sqFrom != ""){
					       //_240131	
	                           break;
							
					       }

                       }

				   }


			   }

		   }

		}

		if(sqFrom == ""){
                                                                // logger.log({function: "chess100.sanToFromTo  ", description: "pawn moved forward", data: {san: o.san, sqTo: sqTo}});
		   // pawn moved forward

		   var squareToTest = "";

		   for(i=1;i<4;i++){

			   squareToTest = squares[squareNumbers[sqTo] + boardSize * i * (active == "w" ? 1 : -1)];

			   if(position[squareToTest].piece != ""){

				   sqFrom = squareToTest;
				   break;

			   }

		   }

		}

		var promotion = "";
		var promotions_ = "QFNZCBR".split(""); //_240422
		//_240422 var promotions_ = "QNFBR".split("");

		for(i=0;i<promotions_.length;i++){

		   if(o.san.indexOf("=" + promotions_[i]) != -1){

			   promotion = promotions_[i];
			   break;

		   }

		}

		var retVal = {from: sqFrom, to: sqTo};

		if(promotion != ""){

		   retVal.promotion = promotion;

		}
                                // logger.log({function: "chess100.sanToFromTo  ", description: "before returning retval", data: {retVal: retVal}}); //_200608
		return retVal

    }

    this.turn = function(){

        return active

    }

    // -------------------- initialize abilities ---------------------

    var abilities64 = {};
    var abilities100 = {};

    var cSquares64 = {

		w00: ["e1","f1","g1","h1"],
		w000: ["e1","d1","c1","b1","a1"],
		b00: ["e8","f8","g8","h8"],
		b000: ["e8","d8","c8","b8","a8"]

    };
    
    // rooks on b & i is the default pattern for 10x10

    var cSquares100 = {

		w00: ["f1","g1","h1","i1"],
		w000: ["f1","e1","d1","c1","b1"],
		b00: ["f10","g10","h10","i10"],
		b000: ["f10","e10","d10","c10","b10"]

    };
    //_240809
    // rooks on a & h is an accepted pattern as well
    
    var cSquares100Long = {

		w00: ["f1","g1","h1","i1","j1"],
		w000: ["f1","e1","d1","c1","b1","a1"],
		b00: ["f10","g10","h10","i10","j10"],
		b000: ["f10","e10","d10","c10","b10","a10"]

    };
    //_240809
    var files64 = ["a","b","c","d","e","f","g","h"];
    var files100 = ["a","b","c","d","e","f","g","h","i","j"];

    // offsets are the numbers that must be added to the index of the square the piece is located on, to get the indices of the fields the piece could reach from this square on an empty board.

    // ranks are used indicate an offboard status. if the rank the detected field is on is not the same as the rank specified for the the offset, the offset led to an offboard field but was incorrectly assigned to a field on the next rank. example: for a knight on e5 an offset -19 matches the field f7 (correct), but for a knight on j5 it matches the field a6 (wrong).

    // separate offsets for black and white pawns, since they can only move in one direction

	var offsets64 = {
        P: [{off:-9, ranks: 1}, {off:-8, ranks: 1}, {off:-16, ranks: 2}, {off:-7, ranks: 1}],
        p: [{off:7, ranks: 1}, {off:8, ranks: 1}, {off:16, ranks: 2}, {off:9, ranks: 1}],
		n: [{off:-15, ranks: 2}, {off:-6, ranks: 1}, {off: 10, ranks: 1}, {off: 17, ranks: 2}, {off: 15, ranks: 2}, {off: 6, ranks: 1}, {off:-10, ranks: 1}, {off:-17, ranks: 2}],
		b: [{off: -7}, {off: 9}, {off: 7}, {off: -9}],
		r: [{off: 1, ranks: 0}, {off: 8}, {off: -1, ranks: 0}, {off: -8}],
		q: [{off: -7}, {off: 1, ranks: 0}, {off: 9}, {off: 8}, {off: 7}, {off: -1, ranks: 0}, {off: -9}, {off: -8}],
		k: [{off: -7, ranks: 1}, {off: 1, ranks: 0}, {off: 9, ranks: 1}, {off: 8, ranks: 1}, {off: 7, ranks: 1}, {off: -1, ranks: 0}, {off: -9, ranks: 1}, {off: -8, ranks: 1}]
	};

	var offsets100 = {
        P: [{off:-11, ranks: 1}, {off:-10, ranks: 1}, {off:-20, ranks: 2}, {off:-30, ranks: 3}, {off:-9, ranks: 1}],
        p: [{off:9, ranks: 1}, {off:10, ranks: 1}, {off:20, ranks: 2}, {off:30, ranks: 3}, {off:11, ranks: 1}],
		c: [{off:-29, ranks: 3}, {off:-7, ranks: 1}, {off: 13, ranks: 1}, {off: 31, ranks: 3}, {off: 29, ranks: 3}, {off: 7, ranks: 1}, {off:-13, ranks: 1}, {off:-31, ranks: 3}], //_240422
		z: [{off:-28, ranks: 3}, {off:-17, ranks: 2}, {off: 23, ranks: 2}, {off: 32, ranks: 3}, {off: 28, ranks: 3}, {off: 17, ranks: 2}, {off:-23, ranks: 2}, {off:-32, ranks: 3}], //_240422
		n: [{off:-19, ranks: 2}, {off:-8, ranks: 1}, {off: 12, ranks: 1}, {off: 21, ranks: 2}, {off: 19, ranks: 2}, {off: 8, ranks: 1}, {off:-12, ranks: 1}, {off:-21, ranks: 2}],
		b: [{off: -9}, {off: 11}, {off: 9}, {off: -11}],
		f: [{off:-29, ranks: 3}, {off:-28, ranks: 3}, {off:-17, ranks: 2}, {off:-7, ranks: 1}, {off: 13, ranks: 1}, {off: 23, ranks: 2}, {off: 32, ranks: 3}, {off: 31, ranks: 3}, {off: 29, ranks: 3}, {off: 28, ranks: 3}, {off: 17, ranks: 2}, {off: 7, ranks: 1}, {off:-13, ranks: 1}, {off:-23, ranks: 2}, {off:-32, ranks: 3}, {off:-31, ranks: 3}],
		r: [{off: 1, ranks: 0}, {off: 10}, {off: -1, ranks: 0}, {off: -10}],
		q: [{off: -9}, {off: 1, ranks: 0}, {off: 11}, {off: 10}, {off: 9}, {off: -1, ranks: 0}, {off: -11}, {off: -10}],
		k: [{off: -9, ranks: 1}, {off: 1, ranks: 0}, {off: 11, ranks: 1}, {off: 10, ranks: 1}, {off: 9, ranks: 1}, {off: -1, ranks: 0}, {off: -11, ranks: 1}, {off: -10, ranks: 1}]
	};

    var pieces64 = ["P", "p", "n", "b", "r", "q", "k"]; //_240422
    var pieces100 = ["P", "p", "c", "z", "n", "b", "f", "r", "q", "k"]; //_240422
    //_240422 var pieces64 = ["P", "p", "n", "b", "r", "q", "k"];   
    //_240422 var pieces100 = ["P", "p", "n", "b", "f", "r", "q", "k"];

    var squareNumbers64 = {};
    var squareNumbers100 = {};

    var squares64 = [];
    var squares100 = [];

    this.generateSquares = function(o){ // boardSize, columns, squareNumbers, squares //_191108

        var columns = "abcdefgh".split("");

        if(o.boardSize == 10){
            
            var columns = "abcdefghij".split("");

        }

        var squareCnt = 0

		for(var i=0;i<o.boardSize;i++){

		    for(var j=0;j<o.boardSize;j++){

		        o.squareNumbers[columns[j] + (o.boardSize - i).toString()] = squareCnt;
		        o.squares.push(columns[j] + (o.boardSize - i).toString());

		        squareCnt++;

		    }

		}

    }

    self.generateSquares({boardSize: 8, squareNumbers: squareNumbers64, squares: squares64}); //_191108
    self.generateSquares({boardSize: 10, squareNumbers: squareNumbers100, squares: squares100}); //_191108

// logger.log({function: "chess100 init", description: "after generating squares", data: {squares64: squares64, squares100: squares100, squareNumbers64: squareNumbers64, squareNumbers100: squareNumbers100}});

    function generateAbilities(o){ // boardSize, piece
                                                           // logger.log({function: "chess100 generate abilities", description: "start", data: {options: o, piece: o.piece}});
        var currentAbilities = [];

        var abilities = abilities64;
        var offsets = offsets64;
        var squares = squares64;

        if(o.boardSize == 10){

            abilities = abilities100;
            offsets = offsets100;
            squares = squares100;

        }

        abilities[o.piece] = {};
                                                            // logger.log({function: "chess100 generate abilities", description: "after init", data: {abilities: abilities[o.piece]}});
		for(var i=0;i<o.boardSize * o.boardSize;i++){

            // loop through all 100 squares to determine the move abilities of the piece for each square

            abilities[o.piece][squares[i]] = [];

		    currentAbilities = abilities[o.piece][squares[i]]; // abilities for the piece on the current square to inspect

		    for(var j=0;j<offsets[o.piece].length;j++){
		                               // logger.log({function: "chess100 knight moves", description: "", data: {ranks: Math.abs(Math.floor(i/10)-Math.floor((i+offsets.n[j].off)/10))}});
                if(o.piece.toLowerCase() == "p"){
                               // logger.log({function: "chess100 generate abilities", description: "for pawn", data: {ranks: Math.abs(Math.floor(i/10)-Math.floor((i+offsets.n[j].off)/10))}});
				    if(squares[i+offsets[o.piece][j].off] != undefined && offsets[o.piece][j].ranks == Math.abs(Math.floor(i/o.boardSize)-Math.floor((i+offsets[o.piece][j].off)/o.boardSize))){

                        if(o.boardSize == 8){

		                    if(!(((i < 8 || (i > 15 && j == 2)) && o.piece == "p") || 
		                         ((i > 55 || (i < 48 && j == 2)) && o.piece == "P"))){

		                        // if the offsets are not invalid because the pawn is located on the initial square or rank 3-5

						        currentAbilities.push(squares[i+offsets[o.piece][j].off])

		                    }

                        }
                        else{

		                    if(!(((i < 10 || (i > 19 && j == 3) || (i > 49 && j == 2)) && o.piece == "p") || 
		                         ((i > 89 || (i < 80 && j == 3) || (i < 50 && j == 2)) && o.piece == "P"))){

		                        // if the offsets are not invalid because the pawn is located on the initial square or rank 3-5

						        currentAbilities.push(squares[i+offsets[o.piece][j].off])

		                    }

                        }

				    }                    

                }
		        //_240422 else if(o.piece == "n" || o.piece == "f" || o.piece == "k"){
                else if(o.piece == "c" || o.piece == "z" || o.piece == "n" || o.piece == "f" || o.piece == "k"){ //_240422
					
                    // generate abilities for aviators and the king

				    if(squares[i+offsets[o.piece][j].off] != undefined && offsets[o.piece][j].ranks == Math.abs(Math.floor(i/o.boardSize)-Math.floor((i+offsets[o.piece][j].off)/o.boardSize))){

				        currentAbilities.push(squares[i+offsets[o.piece][j].off])

				    }

		        }
		        else{

                    // generate abilities for pedestrians

                    var currentOffset = offsets[o.piece][j].off;
                   // logger.log({function: "generateAbilities", description: "before detecting offsets for pedestrians", data: {currentOffset: currentOffset, square: squares[i]}});
		            for(var k=0;k<o.boardSize;k++){

		                if(squares[i + currentOffset] != undefined && ((offsets[o.piece][j].ranks != undefined ? offsets[o.piece][j].ranks : k+1) == Math.abs(Math.floor(i/o.boardSize)-Math.floor((i+currentOffset)/o.boardSize)))){

		                    currentAbilities.push(squares[i+currentOffset]);
                            currentOffset += offsets[o.piece][j].off;
// logger.log({function: "generateAbilities", description: "after adjusting currentOffset", data: {currentOffset: currentOffset, square: squares[i]}});
		                }
                        else{

                            if(k > 0){

                                currentAbilities.push(""); // add an empty space as marker for a direction change

                            }
                            break;

                        }

		            }

		        }

		    }

            if(currentAbilities[currentAbilities.length - 1] == ""){

		        // remove the last empty space element

		        currentAbilities.pop();

            }

		}

                                          // logger.log({function: "chess100 generate abilities", description: "after generating abilities", data: {abilities: abilities[o.piece], piece: o.piece}});

    }

    for(var i=0;i<pieces64.length;i++){

        generateAbilities({boardSize: 8, piece: pieces64[i]})
    
    }

    for(var i=0;i<pieces100.length;i++){
                                                                                // logger.log({function: "initializing", description: "generating abilities for 100", data: {piece: pieces100[i]}})
        generateAbilities({boardSize: 10, piece: pieces100[i]})
    
    }
    // console.dir("some abilities: " + JSON.stringify(abilities100["P"]));
    this.abilities = function(o){ // boardSize, piece, square

        var boardSize = o.boardSize || 8;
                                                              // logger.log({function: "chess100 abilities ", description: "before returning abilities", data: {boardSize: boardSize}})
        if(boardSize == 8){

            return abilities64[o.piece][o.square]

        }
        else{

            return abilities100[o.piece][o.square]

        }

    }

    // console.log(JSON.stringify(abilities))

    // logger.log({function: "initializing", description: "after initializing abilities", data: {abilities: abilities100["k"]}}) // , possibleNMoves: self.possibleMoves({piece: "n", square: "e5"})}});

    // -------------------- initialize abilities ---------------------
    //_260329
    this.arrayToFen = function(o){ // array

        // turns a position array (see this.fenToArray) into a fen.

        var boardSize = (o.array.length <= 72) ? 8 : 10;
        var squaresCnt = boardSize * boardSize;
		var emptyFieldCounter = 0;
		var fen = "";

		for (var i=0; i<squaresCnt; i++){

		  if(o.array[i] == ""){

			  emptyFieldCounter = emptyFieldCounter + 1;

		  }
		  else{

			  if(emptyFieldCounter > 0){

				  fen = fen + emptyFieldCounter.toString();
				  emptyFieldCounter = 0;

			  }

			  fen = fen + o.array[i];

		  }

		  if((i + 1) % boardSize === 0){

			  if(emptyFieldCounter > 0){

				  fen = fen + emptyFieldCounter.toString();

			  }

			  if(i != squaresCnt - 1){

				  emptyFieldCounter = 0;
				  fen = fen + "/";

			  }

		  }

		}

        // handling the meta part if it exists:

        if(o.array.length > squaresCnt){

            var meta = "";
            //_190623
		    for (i=squaresCnt; i<o.array.length; i++){

                if(i < squaresCnt+ + 1 || i > squaresCnt + 4){
// console.log("Adding:" + i + " " + o.array[i])
		            meta = meta + " " + o.array[i];

                }

                if(i == squaresCnt + 1){

                    meta = meta + " ";

                }

                if((i > squaresCnt && i < squaresCnt + 5) && o.array[i] != "-"){ // condition for handling the castling data

		            meta = meta + o.array[i];

                }
             

                if(i == squaresCnt + 4 && meta.length == 3){

                    // no castling permissions left

                    meta = meta + "-";

                }

		    }
            //_190623
            fen = fen + meta;

        }

        return fen

    }
    
    this.fenToArray = function(o){ // addMeta, fen
                                                                                         //_190630 logit.log({function: "Chess.fenToArray", description: "start", data: {o: o}});
        // turns a fen into an array with the pattern ["r","n","b","q","k","b","n","r","p","p","p","p","p","p","p","p","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","B","B","B","B","B","B","B","B","R","N","B","Q","K","B","N","R"]
        // if addMeta is true, the section
        // ["w","K","Q","k","q","-","0","1"]
        // for
        // " w KQkq - 0 1"
        // is added.
        // for
        // " w - - 0 1"
        // it would be
        // ["w","-","-","-","-","-","0","1"]

		var squareNumbers = {
		    a8: 0, b8: 1, c8: 2, d8: 3, e8: 4, f8: 5, g8: 6, h8: 7,
		    a7: 8, b7: 9, c7: 10, d7: 11, e7: 12, f7: 13, g7: 14, h7: 15,
		    a6: 16, b6: 17, c6: 18, d6: 19, e6: 20, f6: 21, g6: 22, h6: 23,
		    a5: 24, b5: 25, c5: 26, d5: 27, e5: 28, f5: 29, g5: 30, h5: 31,
		    a4: 32, b4: 33, c4: 34, d4: 35, e4: 36, f4: 37, g4: 38, h4: 39,
		    a3: 40, b3: 41, c3: 42, d3: 43, e3: 44, f3: 45, g3: 46, h3: 47,
		    a2: 48, b2: 49, c2: 50, d2: 51, e2: 52, f2: 53, g2: 54, h2: 55,
		    a1: 56, b1: 57, c1: 58, d1: 59, e1: 60, f1: 61, g1: 62, h1: 63
		}

        var emptyFieldsCount = 0;
        var fenArray = o.fen.split(" ");
        var position =[];
                                                                               //_190630 logit.log({function: "Chess.fenToArray", description: "with moves", data: {o: o}});
	    for(var i=0;i<fenArray[0].length;i++){

	        if(fenArray[0][i] == " "){

	            break;

	        }
	        else if(!!parseInt(fenArray[0][i])){

                emptyFieldsCount = parseInt(fenArray[0][i], 10);

                // exception handling for an empty rank on a 10x10 board which is represented by the two digit number 10

                if(i<fenArray[0].length-1){

                    if(fenArray[0][i+1] == "0"){

                        emptyFieldsCount = 10;

                        i++;

                    }

                }

                // add an empty string array element for every empty field

                for (var y=0;y<emptyFieldsCount;y++){
	            
	                position.push("");

	            }

	        }
	        else if(fenArray[0][i] != "/"){

	            position.push(fenArray[0][i])

	        }

	    }
                                               //_191001 logit.log({function: "Chess.fenToArray", description: "before adding meta", data: {fenArray: fenArray, position: position}}); //_190914
        // adding meta

        if(o.addMeta == true){

            // detecting the index number that marks the start of the castling section in the position array.
            // there are currently two values possible: 65 for vintage chess and 101 for chess100.

            var firstIndexCastlingSection = position.length + 1;

		    for(i=1; i<fenArray.length;i++){

		        if(i==2){
                                                           //_190630 logit.log({function: "Chess.fenToArray", description: "before specifying castling rights", data: {position: position}});
                    position.push("-","-","-","-");

                    if(fenArray[i] != "-"){

				        // check castling rights

		                var castlings = ["K","Q","k","q"];

                        var classicCastling = false;

                        for(j=0;j<4;j++){

						    if(fenArray[i].indexOf(castlings[j]) != -1){

                                classicCastling = true;
                                position[firstIndexCastlingSection + j] = castlings[j];

                            }

                        }

                        if(classicCastling == false){

                            var castlings960 = fenArray[i].split("");
                                                                 //_190630 logit.log({function: "Chess.fenToArray", description: "960 castling detected", data: {castlings960: castlings960}});
				            for(j=0;j<castlings960.length;j++){
                                                                                                           //_190630 logit.log({function: "Chess.fenToArray", description: "looping through 960 castling", data: {castlings960: castlings960, indexOfK: position.indexOf("K"), rookSquareNumber: squareNumbers[castlings960[j].toLowerCase() + "1"]}});
				                    if(castlings960[j] == castlings960[j].toUpperCase()){

				                        if(position.indexOf("K") > squareNumbers[castlings960[j].toLowerCase() + "1"]){

		                                    // O-O-O

                                            position[firstIndexCastlingSection] = castlings960[j]; //_190930

				                        }
				                        else{

		                                    // O-O

                                            position[firstIndexCastlingSection + 1] = castlings960[j]; //_190930

				                        }


				                    }
				                    else{

				                        if(position.indexOf("k") > squareNumbers[castlings960[j].toLowerCase() + "8"]){

                                            position[firstIndexCastlingSection + 2] = castlings960[j]; //_190930

				                        }
				                        else{

                                            position[firstIndexCastlingSection + 3] = castlings960[j]; //_190930

				                        }

				                    }              

				            }

                        }

                    }

		        }
		        else{
                                                       //_190630 logit.log({function: "Chess.fenToArray", description: "pushing non-castling section"});
		            position.push(fenArray[i])

		        }

		    }

        }
                                                                    //_190630 logit.log({function: "Chess.fenToArray", description: "before returning position", data: {position: position}});
        return position

    }
    //_260329  
};

if (typeof exports != 'undefined') {

    exports.Rules = Rules; //_260329
    //_260329 exports.Chess = Chess;

}

// removing some abandoned code //_251006 //_260329
