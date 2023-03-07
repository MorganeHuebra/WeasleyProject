// Lobby initialisation : must be called in main.ts only
import { rootLink } from "../config";

import {PlayerVariableChanged} from "@workadventure/iframe-api-typings/front/Api/Iframe/players";
import {RemotePlayerInterface} from "@workadventure/iframe-api-typings/front/Api/Iframe/Players/RemotePlayer";
import {UIWebsite} from "@workadventure/iframe-api-typings";

const initiateLobby = async () => {
  WA.player.state.isInviting = null
  WA.player.state.hasBeenInvited = null
  WA.player.state.hasAcceptedInvitation = null

  // Players tracking
  await WA.players.configureTracking()

  // Receive invitations from other players
  WA.players.onVariableChange('isInviting').subscribe((event: PlayerVariableChanged) => {
    if (event.value === WA.player.uuid) { // Works better than player id, but player MUST be logged
      console.log('vous avez été invité par :' + event.player.name)
      WA.player.state.hasBeenInvited = event.value
      openInvitationWebsite()
    }
  })

  // Receive invitation refuse from other players
  WA.players.onVariableChange('hasBeenInvited').subscribe((event: PlayerVariableChanged) => {
    if (!event.value && WA.player.state.isInviting === event.player.uuid) { // Works better than player id, but player MUST be logged
      console.log(event.player.name + 'a refusé votre invitation')
      WA.player.state.isInviting = null // Reset is inviting so that other users can invite current
      // TODO : Close waiting for answer website
    }
  })

  // Receive invitation cancel from invitor
  WA.players.onVariableChange('isInviting').subscribe((event: PlayerVariableChanged) => {
    if (!event.value && WA.player.state.hasBeenInvited === event.player.uuid) { // Works better than player id, but player MUST be logged
      console.log(event.player.name + 'a annulé son invitation')
      WA.player.state.hasBeenInvited = null // Reset so that other users can invite current
      closeInvitationWebsite() // Close website because user cannot accept or refuse anymore
      resetInvitor()
    }
  })

  // Receive invitation acceptation
  WA.players.onVariableChange('hasAcceptedInvitation').subscribe((event: PlayerVariableChanged) => {
    console.log('Someone accepted en invitation', event.player.uuid)
    if (event.value === WA.player.uuid) { // Works better than player id, but player MUST be logged
      console.log('REDIRECTION VERS LE JEU ! pour :' + WA.player.name + ' et ' + event.player.name)
      // TODO : display modal with message : "Vous allez être ridirigé vers le jeu" with a button "C'est parti !"
    }
  })

  // Save user image in variable so other users can get it
  await WA.player.state.saveVariable(
    'playerImage',
    await WA.player.getWokaPicture(),
    {
      public: true
  })

  // Know if user authenticated to prevent others users to invite him
  await WA.player.state.saveVariable(
    'isAuthenticated',
    WA.player.isLogged,
    {
      public: true
  })

  // Watch variables to close website
  WA.player.state.onVariableChange('askForPlayersListWebsiteClose').subscribe((value) => {
    if (value) {
      closePlayersListWebsite()
    }
  })

  WA.player.state.onVariableChange('askForPlayersInvitationWebsiteClose').subscribe((value) => {
    if (value) {
      closeInvitationWebsite()
      resetInvitor()
    }
  })

  WA.player.state.onVariableChange('askForCancelInvitation').subscribe((value) => {
    console.log('askForCancelInvitation changed', value)
    if (value) {
      console.log('value')
      closeWaitingForAnswerWebsite()
      resetInvited()
    }
  })

  WA.player.state.onVariableChange('isInviting').subscribe((value) => {
    if (value) {
      // Close players list
      closePlayersListWebsite()

      // Open waiting modal
      openWaitingForAnswerWebsite()
    }
  })

  // Add button to open players list
  WA.ui.actionBar.addButton({
    id: 'playerListButton',
    label: 'Joueurs', // TODO  :translations
    callback: () => {
      if (!waitingForAnswerWebsite) {
        if (!playerListWebsiteInstance) {
          openPlayersListWebsite()
        } else {
          closePlayersListWebsite()
        }
      }
    }
  })
}

let playerListWebsiteInstance: UIWebsite|null = null
const openPlayersListWebsite = async () => {
  playerListWebsiteInstance =  await WA.ui.website.open({
    url: `${rootLink}/views/lobby/playerList.html`,
    allowApi: true,
    allowPolicy: "",
    position: {
      vertical: "middle",
      horizontal: "middle",
    },
    size: {
      height: "50vh",
      width: "50vw",
    },
  })

  WA.player.state.askForPlayersListWebsiteClose = false
}

const closePlayersListWebsite = () => {
  console.log('close player list', playerListWebsiteInstance)
    playerListWebsiteInstance?.close()
    playerListWebsiteInstance = null
}

const askForPlayersListWebsiteClose = () => {
  WA.player.state.askForPlayersListWebsiteClose = true
}

// Retrieve a list of all other users
const getPlayersList = async () => {
  await WA.players.configureTracking()
  return WA.players.list()
}

// Know if user can invite player passed in parameter
const canInvitePLayer = (player: RemotePlayerInterface) => {
  // If player has invited someone
  // If player has been invited by someone
  if (player.state.isInviting || player.state.hasBeenInvited) {
    return false
  }
  return true
}

const invitePlayer = (player: RemotePlayerInterface) => {
  WA.player.state.saveVariable("isInviting", player.uuid, {
    public: true,
    persist: true,
    ttl: 24 * 3600,
    scope: "world",
  });
}

let invitationWebsiteInstance:UIWebsite|null = null
// Open invitation modal so that user can accept or refuse
const openInvitationWebsite = async () => {
  invitationWebsiteInstance =  await WA.ui.website.open({
    url: `${rootLink}/views/lobby/invitationReceived.html`,
    allowApi: true,
    allowPolicy: "",
    position: {
      vertical: "middle",
      horizontal: "middle",
    },
    size: {
      height: "50vh",
      width: "50vw",
    },
  })

  WA.player.state.askForPlayersInvitationWebsiteClose = false
}

// Close invitation modal
const closeInvitationWebsite = () => {
  console.log('close invitation')
  invitationWebsiteInstance?.close()
  invitationWebsiteInstance = null
}

const resetInvitor = () => {
  WA.player.state.hasBeenInvited = null // Set has been invited to false so that other players can invite current user
}

// User ask for closing in the modal
const askForCloseInvitationWebsite = () => {
  console.log('ask for close invitation')
  WA.player.state.askForPlayersInvitationWebsiteClose = true
}

// Accept invitation
const acceptInvitation = () => {
  console.log('has been invited', WA.player.state.hasBeenInvited)
  if (WA.player.state.hasBeenInvited) {
    WA.player.state.saveVariable(
      'hasAcceptedInvitation',
      WA.player.state.hasBeenInvited, {
      public: true
    })
    console.log('accepted invitation', WA.player.state.hasAcceptedInvitation)
  } else {
    console.log('Oups, une erreur est survenue (no invitor)')
  }
  closeInvitationWebsite()
}

let waitingForAnswerWebsite: UIWebsite|null = null
const openWaitingForAnswerWebsite = async () => {
  console.log('open waiting for answer website')
  waitingForAnswerWebsite =  await WA.ui.website.open({
    url: `${rootLink}/views/lobby/waitingForAnswer.html`,
    allowApi: true,
    allowPolicy: "",
    position: {
      vertical: "middle",
      horizontal: "middle",
    },
    size: {
      height: "50vh",
      width: "50vw",
    },
  })
  WA.player.state.askForCancelInvitation = false
  console.log(waitingForAnswerWebsite)
}

const closeWaitingForAnswerWebsite = () => {
  console.log('close waiting for answer website')
  waitingForAnswerWebsite?.close()
  waitingForAnswerWebsite = null
}

const resetInvited = () => {
  console.log('RESET INVITED')
  console.log('waitingForAnswerWebsite', waitingForAnswerWebsite)
  WA.player.state.isInviting = null
}

const cancelInvitation = () => {
  console.log('cancel invitation')
  resetInvited()
}

const askForCancelInvitation = () => {
  WA.player.state.askForCancelInvitation = true
}

export {
  initiateLobby,
  getPlayersList,
  invitePlayer,
  canInvitePLayer,
  closePlayersListWebsite,
  askForPlayersListWebsiteClose,
  openInvitationWebsite,
  closeInvitationWebsite,
  askForCloseInvitationWebsite,
  acceptInvitation,
  openWaitingForAnswerWebsite,
  closeWaitingForAnswerWebsite,
  cancelInvitation,
  askForCancelInvitation
}