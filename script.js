document.addEventListener('DOMContentLoaded', () => {
  const uniqueId = generateUniqueId()
  const voiceflowRuntime = 'general-runtime.voiceflow.com'
  const voiceflowVersionID = document.getElementById('vfassistant').getAttribute('data-version') || 'production'
  const voiceflowAPIKey = 'VF.DM.679a4750bc56e6ab061df94d.uzw6VsIqPIM0RGVZ'

  let audio = new Audio()
  const wave = document.getElementById('wave')
  const input = document.getElementById('user-input')
  const responseContainer = document.getElementById('response-container')
  const inputPlaceholder = document.getElementById('input-placeholder')
  const inputFieldContainer = document.getElementById('input-container')

  var instance = new SiriWave({
    container: document.getElementById('wave'),
    width: 300,
    height: 120,
    autostart: false,
    curveDefinition: [
      { attenuation: -2, lineWidth: 0.25, opacity: 0.1 },
      { attenuation: -6, lineWidth: 0.15, opacity: 0.2 },
      { attenuation: 4, lineWidth: 0.05, opacity: 0.4 },
      { attenuation: 2, lineWidth: 0.15, opacity: 0.6 },
      { attenuation: 1, lineWidth: 0.2, opacity: 0.9 },
    ],
  })

  // Event Listeners
  inputFieldContainer.addEventListener('click', () => input.focus())
  
  setTimeout(() => {
    inputPlaceholder.style.animation = 'fadeIn 0.5s forwards'
  }, 3000)

  input.addEventListener('click', () => {
    if (!inputPlaceholder.classList.contains('hidden')) {
      inputPlaceholder.style.animation = 'fadeOut 0.5s forwards'
      setTimeout(() => inputPlaceholder.classList.add('hidden'), 500)
    }
  })

  // Background Image Setup
  const imagesList = [
    'pawel-czerwinski-SVVCP23JFyg-unsplash.jpg',
    'pawel-czerwinski-vI5XwPbGvmY-unsplash.jpg',
    'pawel-czerwinski-83y-Ud-UHoo-unsplash.jpg',
    'pawel-czerwinski-eiKm9AmXxZo-unsplash.jpg',
    'pawel-czerwinski-iQcqqTBxMFk-unsplash.jpg',
    'pawel-czerwinski-db2y7AD7s7M-unsplash.jpg',
    'pawel-czerwinski-WZWxuwX-ce4-unsplash.jpg',
    'pawel-czerwinski-keVhq8uU23M-unsplash.jpg',
    'pawel-czerwinski-Ulbtb_46xlc-unsplash.jpg',
    'pawel-czerwinski-FAlYVtV1kRg-unsplash.jpg',
  ]

  function getRandomImage() {
    return imagesList[Math.floor(Math.random() * imagesList.length)]
  }

  const background = document.getElementById('background')
  background.style.backgroundImage = `url('./images/${getRandomImage()}')`
  background.style.opacity = '1'
  
  const credits = document.getElementById('credits')
  const by = document.createElement('p')
  by.innerHTML = 'By Dario Amini'
  credits.appendChild(by)
  credits.style.opacity = '0.6'
  document.getElementById('overlay').style.opacity = '0.8'

  // Input handling
  input.addEventListener('focus', () => input.style.caretColor = 'transparent')
  input.addEventListener('blur', () => input.style.caretColor = 'white')

  input.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      const userInput = input.value.trim()
      if (userInput) {
        input.disabled = true
        input.classList.add('fade-out')
        responseContainer.style.opacity = '1'
        if (audio && !audio.paused) {
          wave.style.opacity = '0'
          audio.pause()
        }
        interact(userInput)
      }
    }
  })

  async function interact(input) {
    let body = {
      config: { tts: true, stripSSML: true },
      action: { type: input === '#launch#' ? 'launch' : 'text', payload: input },
    }

    fetch(`https://${voiceflowRuntime}/state/user/${uniqueId}/interact/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: voiceflowAPIKey,
        versionID: voiceflowVersionID,
      },
      body: JSON.stringify(body),
    })
      .then(response => response.json())
      .then(data => displayResponse(data))
      .catch(() => displayResponse(null))
  }

  function displayResponse(response) {
    console.log('Dialog API Response:', response)
    responseContainer.style.opacity = '0'
    wave.style.opacity = '0'
    instance.start()

    setTimeout(() => {
      let audioQueue = []
      responseContainer.innerHTML = ''

      if (response) {
        response.forEach(item => {
          if (item.type === 'speak' || item.type === 'text') {
            if (item.payload.message) {
              // Split message into paragraphs and create elements
              const paragraphs = item.payload.message.split('\n').filter(p => p.trim())
              
              paragraphs.forEach((paragraph, index) => {
                const textElement = document.createElement('p')
                textElement.textContent = paragraph
                textElement.style.opacity = '0'
                textElement.style.marginBottom = '1.5em'
                
                if (item.type === 'speak') {
                  textElement.setAttribute('data-src', item.payload.src)
                  audioQueue.push(item.payload.src)
                } else {
                  textElement.style.transition = 'opacity 0.5s'
                  setTimeout(() => textElement.style.opacity = '1', 50 * index)
                }
                
                responseContainer.appendChild(textElement)
              })
            }
          } else if (item.type === 'visual') {
            const imageElement = document.createElement('img')
            imageElement.src = item.payload.image
            imageElement.alt = 'Assistant Image'
            imageElement.style.cssText = `
              border: 2px solid white;
              width: auto;
              height: auto;
              max-width: 80%;
              opacity: 0;
              margin: 1.5em auto;
              box-shadow: 0px 0px 16px 1px rgba(0, 0, 0, 0.1), 0px 0px 16px 1px rgba(0, 0, 0, 0.08);
              cursor: pointer;
              transition: opacity 2.5s;
            `
            responseContainer.appendChild(imageElement)
            setTimeout(() => imageElement.style.opacity = '1', 100)
            imageElement.addEventListener('click', () => showModal(item.payload.image))
          }
        })
      } else {
        const errorElement = document.createElement('p')
        errorElement.textContent = 'Sorry, GPT took too long to respond.\n\nPlease try again.'
        errorElement.style.opacity = '0'
        responseContainer.appendChild(errorElement)
        setTimeout(() => errorElement.style.opacity = '1', 100)
      }

      responseContainer.style.opacity = '1'

      function playNextAudio() {
        wave.style.opacity = '1'
        if (audioQueue.length === 0) {
          wave.style.opacity = '0'
          instance.stop()
          input.blur()
          setTimeout(() => input.focus(), 100)
          return
        }

        const audioSrc = audioQueue.shift()
        audio = new Audio(audioSrc)
        
        const textElement = responseContainer.querySelector(`[data-src="${audioSrc}"]`)
        if (textElement) {
          const previousText = textElement.previousElementSibling
          if (previousText && previousText.tagName === 'P') {
            previousText.style.opacity = '0.5'
          }
          textElement.style.transition = 'opacity 0.5s'
          textElement.style.opacity = '1'
        }

        audio.addEventListener('canplaythrough', () => audio.play())
        audio.addEventListener('ended', playNextAudio)
        audio.addEventListener('error', () => {
          console.error('Error playing audio:', audio.error)
          playNextAudio()
        })
      }

      playNextAudio()
    }, 250)

    setTimeout(() => {
      input.disabled = false
      input.value = ''
      input.classList.remove('fade-out')
      input.blur()
      input.focus()
    }, 200)
  }

  setTimeout(() => {
    inputFieldContainer.style.animation = 'fadeIn 4s forwards'
  }, 2500)

  function showModal(imageSrc) {
    const modal = document.createElement('div')
    modal.id = 'modal'
    modal.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      opacity: 0;
      transition: opacity 0.3s ease;
    `

    const modalImage = document.createElement('img')
    modalImage.src = imageSrc
    modalImage.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      border: 2px solid white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
    `

    modal.appendChild(modalImage)
    document.body.appendChild(modal)
    setTimeout(() => modal.style.opacity = '1', 100)

    modal.addEventListener('click', () => {
      modal.style.opacity = '0'
      setTimeout(() => document.body.removeChild(modal), 300)
    })
  }
})

function generateUniqueId() {
  const randomStr = Math.random().toString(36).substring(2, 8)
  const dateTimeStr = new Date().toISOString()
  const dateTimeStrWithoutSeparators = dateTimeStr
    .replace(/[-:]/g, '')
    .replace(/\.\d+/g, '')
  return randomStr + dateTimeStrWithoutSeparators
}
