/* global $ */

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})
const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2
})

function setIsLoading (isLoading) {
  if (isLoading) {
    $('#isLoading').removeClass('hidden')
    return
  }
  $('#isLoading').addClass('hidden')
}
function shortenString (str, maxLength = 10) {
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str
}

function humanizeAddress (address) {
  if (typeof address !== 'string' || address.length !== 42) {
    throw new Error('Invalid Ethereum address')
  }
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

function copyToClipboard (text) {
  const tempInput = document.createElement('input')
  tempInput.value = text
  document.body.appendChild(tempInput)
  tempInput.select()
  document.execCommand('copy')
  document.body.removeChild(tempInput)
  window.alert('Copied to clipboard!')
}

function formatNumber (num) {
  return new Intl.NumberFormat().format(num)
}

function toggleAccordion (event) {
  console.log('toggleAccordion', event.currentTarget.parentElement)
  const panel = $(event.currentTarget.parentElement).next('.panel')
  console.log('panel', panel)
  panel.toggleClass('hidden')
}

function generateEndpointCompleteSwap (commitment) {
  const value = commitment.preimage.value

  if (value.erc20AddressSent !== '0' && value.erc20AddressRecieved !== '0' &&
    value.swapTokenSentId === '0' && value.swapTokenRecievedId === '0') {
    return '/completeSwapFromErc20ToErc20'
  }
  if (value.erc20AddressSent !== '0' && value.erc20AddressRecieved === '0' &&
    value.swapTokenSentId === '0' && value.swapTokenRecievedId !== '0') {
    return '/completeSwapFromErc20ToErc1155'
  }
  if (value.erc20AddressSent === '0' && value.erc20AddressRecieved === '0' &&
    value.swapTokenSentId !== '0' && value.swapTokenRecievedId !== '0') {
    return '/completeSwapFromErc1155ToErc1155'
  }
  if (value.erc20AddressSent === '0' && value.erc20AddressRecieved !== '0' &&
    value.swapTokenSentId !== '0' && value.swapTokenRecievedId === '0') {
    return '/completeSwapFromErc1155ToErc20'
  }
  return 'Unknown Scenario'
}