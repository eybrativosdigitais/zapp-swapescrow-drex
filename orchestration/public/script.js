/* global $, ethers, localStorage, toastr, setIsLoading, toggleAccordion */

const copyIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
</svg>
`

const removeIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
</svg>
`

let tokenAddresses = []
localStorage.setItem('tokenAddresses', null);

const initializeTokenAddresses = (addresses) => {
  tokenAddresses = addresses
  updateTokenAddressList()
  fetchBalances()
}

const generateTokenAddressHTML = (address, type, balance = 'Loading...', publicBalance = 'Loading...') => `
  <tr>
    <td class="px-6 py-4 whitespace-nowrap flex gap-2 items-center text-sm text-gray-900">
      ${type === 'erc1155' ? `Quantidade de Titulos Públicos (ID: ${address})` : `Endereço do token: ${humanizeAddress(address)}`}
      <span class="copy-btn" onclick="copyToClipboard('${address}')">${copyIconSVG}</span>
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 shielded-balance" data-address="${address}">${balance}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 public-balance" data-address="${address}">${publicBalance}</td>
    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <button class="removeTokenAddress bg-red-500 text-white text-xl px-2 py-2 rounded-lg" data-address="${address}">${removeIconSVG}</button>
    </td>
  </tr>
`

const updateTokenAddressList = () => {
  $('#tokenAddressList').empty()
  tokenAddresses.filter((obj) => obj.type !== 'erc1155').forEach(obj => {
    const address = obj.address
    $('#tokenAddressList').append(generateTokenAddressHTML(address, 'erc20'))
  })
}

const fetchBalances = () => {
  const erc20Addresses = []
  const erc1155Addresses = []
  const erc1155TokenIds = [1, 2, 3]

  tokenAddresses.forEach(obj => {
    const { address, type } = obj
    if (type === 'erc1155') {
      erc1155Addresses.push(address)
    } else {
      erc20Addresses.push(address)
    }
  })

  const fetchBalances = (url, updateFn) => {
    $.ajax({
      type: 'GET',
      url,
      contentType: 'application/json',
      success: updateFn,
      error: () => {
        erc20Addresses.concat(erc1155Addresses).forEach(address => {
          $(`.shielded-balance[data-address='${address}'], .public-balance[data-address='${address}']`).text('-')
        })
      }
    })
  }

  const updateShieldedBalances = (response) => {
    // Update ERC20 shielded balances
    erc20Addresses.forEach(address => {
      if (response.balances.balances[address] === "-1") {
        // remove this element
        console.log('errror', 'token nao existe', address);
        window.alert(`Token informado ${address} não existe`);
        $(`.shielded-balance[data-address='${address}']`).parent().remove()
        return
      }
      const balance = parseFloat(response.balances.balances[address] || 0).toFixed(2)
      $(`.shielded-balance[data-address='${address}']`).text(balance)
    })

    // Update ERC1155 shielded balances
    const erc1155Balances = response.balances.tokenOwners
    Object.keys(erc1155Balances).forEach((key) => {
      const balance = parseFloat(erc1155Balances[key]).toFixed(2)
      if ($(`.shielded-balance[data-address='${key}']`).length === 0) {
        $('#tokenAddressList').append(generateTokenAddressHTML(key, 'erc1155', balance, '-'))
      } else {
        $(`.shielded-balance[data-address='${key}']`).text(balance)
      }
    })
  }

  const updatePublicBalances = (response) => {
    // Update ERC20 public balances
    erc20Addresses.forEach(address => {
      if (response.balances.balances[address] === "-1") {
        // remove this element
        console.log('errror', 'token nao existe', address);
        window.alert(`Token informado ${address} não existe`);
        $(`.public-balance[data-address='${address}']`).parent().remove()
        return
      }
      const balance = ethers.utils.formatUnits(response.balances.balances[address] || 0, 2)
      $(`.public-balance[data-address='${address}']`).text(balance)
    })

    // Update ERC1155 public balances
    const erc1155Balances = response.balances.tokenOwners
    Object.keys(erc1155Balances).forEach((key) => {
      const balance = parseFloat(erc1155Balances[key]).toFixed(2)
      if ($(`.public-balance[data-address='${key}']`).length === 0) {
        $('#tokenAddressList').append(generateTokenAddressHTML(key, 'erc1155', '-', balance))
      } else {
        $(`.public-balance[data-address='${key}']`).text(balance)
      }
    })
  }

  const shieldedBalanceUrl = `/shielded-balance?erc20Address[]=${erc20Addresses.join('&erc20Address[]=')}&erc1155TokenIds[]=${erc1155TokenIds.join('&erc1155TokenIds[]=')}`
  const publicBalanceUrl = `/public-balance?erc20Address[]=${erc20Addresses.join('&erc20Address[]=')}&erc1155TokenIds[]=${erc1155TokenIds.join('&erc1155TokenIds[]=')}`

  fetchBalances(shieldedBalanceUrl, updateShieldedBalances)
  fetchBalances(publicBalanceUrl, updatePublicBalances)
}

const loadTokenAddressesFromLocalStorage = () => {
  const storedAddresses = localStorage.getItem('tokenAddresses')
  if (storedAddresses) {
    tokenAddresses = JSON.parse(storedAddresses)
    updateTokenAddressList()
    fetchBalances()
  }
}

$(document).on('click', '#addTokenAddress', () => {
  const address = $('#tokenAddressInput').val()
  if (address && !tokenAddresses.find(addr => addr.address === address)) {
    tokenAddresses.push({ address, type: 'erc20' })
    updateTokenAddressList()
    fetchBalances()
  }
})

$(document).on('click', '.removeTokenAddress', function () {
  if (!window.confirm('Tem certeza que gostaria de remover esse endereço da lista?')) return
  const address = $(this).data('address')
  tokenAddresses = tokenAddresses.filter(addr => addr.address !== address)
  updateTokenAddressList()
  fetchBalances()
})

const initializeEnvironment = async () => {
  try {
    const response = await fetch('/stats')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Failed to initialize environment:', error)
  }
}

const generateInfoTableRow = (key, value) => `
  <div class="flex justify-between px-6">
    <span class="font-bold font-medium">${key}</span>
    <span class="text-sm flex items-center justify-center">&nbsp;${value}</span>
  </div>
`;

(async function () {
  const response = await initializeEnvironment()

  $('#tokenInfoTable').append(generateInfoTableRow('ERC20 Token: ', response.tokens.ERC20))
  $('#tokenInfoTable').append(generateInfoTableRow('ERC1155 Token: ', response.tokens.ERC1155))
  $('#tokenAllowanceTable').append(generateInfoTableRow('ERC20 Token: ', response.allowances.ERC20))
  $('#tokenAllowanceTable').append(generateInfoTableRow('ERC1155 Token: ', response.allowances.ERC1155))
  $('#processEnvTable').append(generateInfoTableRow('Own Address: ', response.ownAddress))
  $('#processEnvTable').append(generateInfoTableRow('Swap Shield Address: ', response.swapShieldAddress))
  $('#processEnvTable').append(generateInfoTableRow('Swap Shield Block Start: ', response.swapShieldDeployBlocknumber))
  $('#processEnvTable').append(generateInfoTableRow('RPC URL: ', response.rpcUrl))
  $('#processEnvTable').append(generateInfoTableRow('Gas Price: ', response.gasPrice))
  $('#processEnvTable').append(generateInfoTableRow('Gas Limit: ', response.gasLimit))
  $('#chainInfoTable').append(generateInfoTableRow('Own Public Key: ', response.ownPublicKey))
  $('#chainInfoTable').append(generateInfoTableRow('Swap ID Counter: ', response.swapIdCounter))
  $('#chainInfoTable').append(generateInfoTableRow('Latest Root: ', response.latestRoot))

  const swapSender = response.ownAddress
  const currentBank = response.ownAddress

  const isBesu = !window.location.href.includes(':300')

  let mode = 'erc20'
  let modeTo = 'ToErc1155'

  const initialAddresses = [
    { address: response.tokens.ERC20, type: 'erc20' },
    { address: response.tokens.ERC1155, type: 'erc1155' }
  ]

  initializeTokenAddresses(initialAddresses)

  function showHideFields() {
    const modeCombined = mode + modeTo

    const fieldConfig = {
      erc20ToErc20: {
        hide: ['#tokenIdSentInput', '#tokenIdSentAmountInput', '#tokenIdReceivedInput', '#labelTokenIdReceived', '#labelTokenIdSentAmount', '#labelTokenIdSent'],
        show: ['#labelErc20AddressReceived', '#labelTokenReceivedAmount', '#tokenReceivedAmountInput', '#erc20AddressReceivedInput', '#swapTokenAddressInput', '#amountSentInput']
      },
      erc20ToErc1155: {
        hide: ['#tokenIdSentInput', '#tokenIdSentAmountInput', '#labelErc20AddressReceived', '#erc20AddressReceivedInput', '#tokenReceivedAmountInput', '#labelTokenIdSentAmount', '#labelTokenIdSent'],
        show: ['#tokenIdReceivedInput', '#amountSentInput', '#swapTokenAddressInput', '#tokenReceivedAmountInput', '#labelAmountSent', '#labelTokenIdReceived']
      },
      erc1155ToErc20: {
        hide: ['#tokenIdSentAmountInput', '#labelTokenIdSentAmount', '#erc20AddressReceivedInput', '#tokenIdReceivedInput', '#labelErc20AddressReceived', '#labelTokenIdReceived'],
        show: ['#tokenIdSentInput', '#swapTokenAddressInput', '#amountSentInput', '#tokenReceivedAmountInput', '#amountReceivedInput', '#labelTokenIdSent', '#labelAmountSent']
      },
      erc1155ToErc1155: {
        hide: ['#amountSentInput', '#erc20AddressReceivedInput', '#swapTokenAddressInput', '#labelAmountSent'],
        show: ['#tokenIdSentInput', '#tokenIdSentAmountInput', '#tokenIdReceivedInput', '#tokenReceivedAmountInput', '#labelTokenIdSent', '#labelTokenIdSentAmount', '#labelTokenIdReceived']
      }
    }

    function applyClasses(fieldArray, action) {
      fieldArray.forEach(selector => {
        $(selector)[action]('hidden')
      })
    }

    const config = fieldConfig[modeCombined]
    if (config) {
      applyClasses(config.hide, 'addClass')
      applyClasses(config.show, 'removeClass')
    }
  }

  $('#erc20Tab').click(function () {
    $('#tokenAddressDeposit').removeClass('hidden').parent().removeClass('hidden')
    $('#labelTokenAddress').removeClass('hidden')
    $('#tokenAddressDeposit').val('')
    $('#erc20Tab').attr('aria-selected', true)
    $('#erc1155Tab').attr('aria-selected', false)
    $('#tokenIdInput').addClass('hidden')
    $('#tokenIdErc1155').addClass('hidden')
    $('#labeltokenIdErc1155').addClass('hidden')
    mode = 'erc20'
    showHideFields()
  })
  $('#erc20Tab').click()

  $('#erc1155Tab').click(function () {
    $('#tokenAddressDeposit').val(response.tokens.ERC1155).addClass('hidden').parent().addClass('hidden')
    $('#labelTokenAddress').addClass('hidden')
    $('#erc20Tab').attr('aria-selected', false)
    $('#erc1155Tab').attr('aria-selected', true)
    $('#tokenIdInput').removeClass('hidden')
    $('#tokenIdErc1155').removeClass('hidden')
    $('#labeltokenIdErc1155').removeClass('hidden')
    mode = 'erc1155'
    showHideFields()
  })

  $('#erc20TabTo').click(function () {
    modeTo = 'ToErc20'
    $('#erc20TabTo').attr('aria-selected', true)
    $('#erc1155TabTo').attr('aria-selected', false)
    showHideFields()
  })

  $('#erc1155TabTo').click(function () {
    modeTo = 'ToErc1155'
    $('#erc1155TabTo').attr('aria-selected', true)
    $('#erc20TabTo').attr('aria-selected', false)
    showHideFields()
  })
  $('#erc1155TabTo').click()

  $(document).ready(function () {
    let uniqueData = [] // Store the fetched data

    // Update the commitments table based on the selected filters
    const filterCommitments = (commitments) => {
      const typeFilter = $('#typeFilter').val();
      const statusFilter = $('#statusFilter').val();

      // Filter commitments based on selected type and status
      const filteredCommitments = commitments.filter(commitment => {
        const typeMatches = typeFilter ? commitment.name === typeFilter : true;
        const statusMatches = statusFilter ? commitment.isNullified.toString() === statusFilter : true;
        return typeMatches && statusMatches;
      }).sort((a, b) => parseInt(b.mappingKey) - parseInt(a.mappingKey))
      // Render the filtered commitments
      renderCommitmentsTable(filteredCommitments);
    };

    // Render commitments table rows
    const renderCommitmentsTable = (commitments) => {
      $('#commitmentsTable').empty();
      const nameClasses = {
        balances: 'bg-blue-500 text-white',
        tokenOwners: 'bg-green-500 text-white',
        swapProposals: 'bg-yellow-500 text-white'
      };

      commitments.forEach(commitment => {
        const nameClass = nameClasses[commitment.name] || 'bg-gray-500 text-white';
        const preimageValue = typeof commitment.preimage.value === 'object' ? 'Detalhes' : numberFormatter.format(commitment.preimage.value);
        const preimageClass = typeof commitment.preimage.value === 'object' ? 'text-blue-500 underline accordion cursor-pointer' : '';

        $('#commitmentsTable').append(`
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm flex font-medium text-gray-900">
          ${shortenString(commitment.mappingKey)}
          <span class="copy-btn" onclick="copyToClipboard('${commitment.mappingKey}')">${copyIconSVG}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
          <div class="${nameClass} w-auto text-center rounded-full px-3 py-1">${commitment.name}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm ${preimageClass}">${preimageValue}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm ${commitment.isNullified ? 'text-red-600' : 'text-green-600'}">${commitment.isNullified}</td>
      </tr>
      <tr class="panel hidden transition">
        <td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div class="panel-content">
            <h4 class="font-semibold mb-2">Detalhes</h4>
            ${typeof commitment.preimage.value === 'object'
            ? `
                <div>
                  <p><strong>Swap Amount Sent:</strong> ${formatNumber(commitment.preimage.value.swapAmountSent)}</p>
                  <p><strong>Swap Amount Received:</strong> ${formatNumber(commitment.preimage.value.swapAmountRecieved)}</p>
                  <p><strong>Swap Token Sent ID:</strong> ${commitment.preimage.value.swapTokenSentId}</p>
                  <p><strong>Swap Token Sent Amount:</strong> ${formatNumber(commitment.preimage.value.swapTokenSentAmount)}</p>
                  <p><strong>Swap Token Received ID:</strong> ${commitment.preimage.value.swapTokenRecievedId}</p>
                  <p><strong>Swap Token Received Amount:</strong> ${formatNumber(commitment.preimage.value.swapTokenRecievedAmount)}</p>
                  <p><strong>Swap ID:</strong> ${commitment.preimage.value.swapId}</p>
                  <p><strong>Swap Sender:</strong> ${commitment.preimage.value.swapSender}</p>
                  <p><strong>Swap Receiver:</strong> ${commitment.preimage.value.swapReciever}</p>
                  <p><strong>ERC20 Address Sent:</strong> ${commitment.preimage.value.erc20AddressSent}</p>
                  <p><strong>ERC20 Address Received:</strong> ${commitment.preimage.value.erc20AddressRecieved}</p>
                  <p><strong>Pending Status:</strong> ${commitment.preimage.value.pendingStatus}</p>
                </div>
              `
            : `
                <p><strong>Value:</strong> ${formatNumber(commitment.preimage.value)}</p>
              `}
          </div>
        </td>
      </tr>
    `);
      });

      $('.accordion').click(toggleAccordion);
    };

    // Load commitments and filter them based on user input
    const loadCommitments = () => {
      setIsLoading(true);
      $.ajax({
        type: 'GET',
        url: `/parsedCommitment?erc20Address[]=${response.tokens.ERC20}&erc1155TokenIds[]=1&erc1155TokenIds[]=2`,
        contentType: 'application/json',
        success: function (response) {
          setIsLoading(false);
          const commitments = response.commitments;
          filterCommitments(commitments);  // Initially filter commitments
          // Add event listeners for dropdowns to filter commitments dynamically
          $('#typeFilter, #statusFilter').change(() => filterCommitments(commitments));
        },
        error: function () {
          setIsLoading(false);
          console.log('Error getting commitments');
        }
      });
    };

    loadCommitments();

    const fetchSwapData = () => {
      const fetchData = (params) => $.ajax({ url: '/swap', type: 'GET', data: params })

      setIsLoading(true)
      $.when(
        fetchData({ swapSender }),
        fetchData({ swapReceiver: swapSender })
      ).done((senderResponse, receiverResponse) => {
        setIsLoading(false)
        const senderData = senderResponse[0].commitments
        const receiverData = receiverResponse[0].commitments

        uniqueData = [...senderData, ...receiverData].reduce((acc, item) => {
          const existingItemIndex = acc.findIndex(accItem => accItem.preimage.value.swapId === item.preimage.value.swapId)
          if (existingItemIndex > -1) {
            if (item.preimage.value.pendingStatus === '0') {
              acc[existingItemIndex] = item
            }
          } else {
            acc.push(item)
          }
          return acc
        }, [])

        renderSwapTable(uniqueData)
      }).fail((error) => {
        setIsLoading(false)
        console.error('Error fetching swap data:', error)
      })
    }

    fetchSwapData()

    const renderSwapTable = (data) => {
      $('#swapTableBody').empty()

      const selectedStatus = $('#statusFilter').val()
      const filteredData = selectedStatus
        ? data.filter(item => {
          let statusText
          // switch (item.preimage.value.pendingStatus) {
          //   case '0': statusText = 'Completed'; break
          //   case '1': statusText = 'Open'; break
          //   case '2': statusText = 'Cancelled'; break
          //   default: statusText = 'Unknown'
          // }
          if (item.isNullified) {
            statusText = 'Fechado'
          } else {
            statusText = 'Aberto'
          }
          return statusText === selectedStatus
        })
        : data

      filteredData
        .sort((a, b) => parseInt(b.preimage.value.swapId) - parseInt(a.preimage.value.swapId))
        .forEach(item => {
          let statusText, statusClass
          if (item.isNullified) {
            statusText = 'Fechado'
            statusClass = 'bg-red-200 text-red-800'
          } else {
            statusText = 'Aberto'
            statusClass = 'bg-green-200 text-green-800'
          }
          // switch (item.preimage.value.pendingStatus) {
          //   case '0': statusText = 'Completed'; statusClass = 'bg-green-200 text-green-800'; break
          //   case '1': statusText = 'Open'; statusClass = 'bg-blue-200 text-blue-800'; break
          //   case '2': statusText = 'Cancelled'; statusClass = 'bg-red-200 text-red-800'; break
          //   default: statusText = 'Unknown'; statusClass = 'bg-gray-200 text-gray-800'
          // }
          const swapReceiver = item.preimage.value.swapReciever
          const swapSender = item.preimage.value.swapSender
          const endpoint = generateEndpointCompleteSwap(item)
          let actionButton = ''
          if (statusText !== 'Completed') {
            actionButton = swapReceiver.toLowerCase() === currentBank.toLowerCase()
              ? `<button class="complete-swap inline-flex items-center justify-center text-[12px] font-medium bg-green-500 text-white hover:bg-green-700 rounded h-10 px-4 py-2" data-swap-id="${item.preimage.value.swapId}" data-endpoint="${endpoint}">
            Completar Swap
          </button>`
              : `<button class="cancel-swap inline-flex items-center justify-center text-[12px] font-medium bg-red-500 text-white hover:bg-red-700 rounded h-10 px-4 py-2" data-swap-id="${item.preimage.value.swapId}" data-endpoint="${endpoint}">
            Cancelar Swap
          </button>`
          }
          if (item.isNullified) {
            actionButton = "";
          }
          $('#swapTableBody').append(`
          <tr class="border-b transition-colors hover:bg-gray-100">
            <td class="p-4 align-middle">${item.preimage.value.swapId}</td>
            <td class="p-4 align-middle">${humanizeAddress(swapReceiver)}</td>
            <td class="p-4 align-middle">${humanizeAddress(swapSender)}</td>
            <td class="p-4 align-middle">
              <span class="px-2 py-1 ${statusClass} rounded-md">${statusText}</span>
            </td>
            <td class="p-4 align-middle">
              ${actionButton}
            </td>
          </tr>
        `)
        })

      $('.complete-swap').click(function () {
        const swapId = $(this).data('swap-id')
        const endpoint = $(this).data('endpoint')
        completeSwap(endpoint, swapId)
      })

      $('.cancel-swap').click(function () {
        const swapId = $(this).data('swap-id')
        cancelSwap(swapId)
      })
    }

    $('#statusFilter').change(() => renderSwapTable(uniqueData))

    const cancelSwap = (swapId) => {
      setIsLoading(true)
      toastr.info('Cancelling swap...')
      $.ajax({
        type: 'POST',
        url: '/cancelSwap',
        data: JSON.stringify({ swapId }),
        contentType: 'application/json',
        success: (response) => {
          if (response.errors) {
            toastr.error('Error cancelling swap.', response.errors.join(', '))
          } else {
            toastr.success('Swap cancelled successfully!')
          }
          setIsLoading(false)
          fetchSwapData()
        },
        error: (xhr) => {
          toastr.error('Error cancelling swap. ' + xhr.responseText)
          console.error('Error during swap cancellation:', xhr)
          setIsLoading(false)
          fetchSwapData()
        }
      })
    }

    const completeSwap = (endpoint, swapId) => {
      setIsLoading(true)
      toastr.info('Completing swap...')
      $.ajax({
        type: 'POST',
        url: endpoint,
        data: JSON.stringify({ swapId }),
        contentType: 'application/json',
        success: (response) => {
          if (response.errors) {
            toastr.error('Error completing swap.', response.errors.join(', '))
          } else {
            toastr.success('Swap completed successfully!')
          }
          setIsLoading(false)
          fetchBalances()
          fetchSwapData()
        },
        error: (xhr) => {
          toastr.error('Error completing swap. ' + xhr.responseText)
          console.error('Error during swap completion:', xhr)
          setIsLoading(false)
          fetchSwapData()
        }
      })
    }

    const handleFormSubmission = (url, dataExtractor) => {
      setIsLoading(true)
      toastr.info('Processing deposit...')

      const jsonData = JSON.stringify(dataExtractor())

      $.ajax({
        type: 'POST',
        url,
        data: jsonData,
        contentType: 'application/json',
        success: (response) => {
          setIsLoading(false)
          fetchBalances()
          if (response.errors) {
            toastr.error('Error depositing tokens.', response.errors.join(', '))
          } else {
            toastr.success('Deposit successful!')
          }
        },
        error: (xhr) => {
          setIsLoading(false)
          const errorMsg = xhr.responseText ? xhr.responseText.substring(0, 100) : 'Unexpected error'
          toastr.error(`Error depositing tokens. Details: ${errorMsg}`)
          console.error(`Error during ${url} request`, xhr)
        }
      })
    }

    const getErc20Data = () => ({
      erc20Address: $('#tokenAddressDeposit').val(),
      amount: parseFloat($('#amountDeposit').val())
    })

    const getErc1155Data = () => ({
      tokenId: $('#tokenIdErc1155').val(),
      amount: parseFloat($('#amountDeposit').val()),
      erc1155Address: $('#tokenAddressDeposit').val()
    })

    $('#depositButton').click(() => {
      if (mode === 'erc20') {
        handleFormSubmission('/depositErc20', getErc20Data)
        return
      }
      handleFormSubmission('/depositErc1155', getErc1155Data)
    })

    $('#startSwapButton').click(() => {
      toastr.info('Starting swap...')
      setIsLoading(true)

      const combined = mode + modeTo
      const endpoints = {
        erc20ToErc20: '/startSwapFromErc20ToErc20',
        erc20ToErc1155: '/startSwapFromErc20ToErc1155',
        erc1155ToErc20: '/startSwapFromErc1155ToErc20',
        erc1155ToErc1155: '/startSwapFromErc1155ToErc1155'
      }
      let data = {
        erc20Address: $('#swapTokenAddress').val(),
        counterParty: $('#counterParty').val(),
        amountSent: parseFloat($('#amountSent').val()),
        tokenIdReceived: parseFloat

          ($('#tokenIdReceived').val()),
        tokenReceivedAmount: parseFloat($('#tokenReceivedAmount').val())
      }

      if (combined === 'erc20ToErc20') {
        data = {
          erc20AddressSent: $('#swapTokenAddress').val(),
          erc20AddressReceived: $('#erc20AddressReceived').val(),
          counterParty: $('#counterParty').val(),
          amountSent: parseFloat($('#amountSent').val()),
          amountReceived: parseFloat($('#tokenReceivedAmount').val())
        }
      } else if (combined === 'erc1155ToErc1155') {
        data = {
          counterParty: $('#counterParty').val(),
          tokenIdSent: $('#tokenIdSent').val(),
          tokenSentAmount: $('#tokenIdSentAmount').val(),
          tokenIdReceived: $('#tokenIdReceived').val(),
          tokenReceivedAmount: $('#tokenReceivedAmount').val()
        }
      } else if (combined === 'erc1155ToErc20') {
        data = {
          erc20Address: $('#swapTokenAddress').val(),
          counterParty: $('#counterParty').val(),
          amountReceived: parseFloat($('#tokenReceivedAmount').val()),
          tokenIdSent: $('#tokenIdSent').val(),
          tokenSentAmount: $('#amountSent').val()
        }
      }

      $.ajax({
        type: 'POST',
        url: endpoints[combined],
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: (response) => {
          setIsLoading(false)
          if (response.errors) {
            toastr.error('Error starting swap.', response.errors.join(', '))
          } else {
            toastr.success('Swap started successfully!')
          }
          fetchBalances()
          fetchSwapData()
        },
        error: (xhr) => {
          setIsLoading(false)
          toastr.error('Error starting swap. ' + xhr.responseText)
          console.error('Error during swap initiation:', xhr)
        }
      })
    })

    $('#withdrawButton').click(() => {
      setIsLoading(true)
      const data = {
        erc20Address: $('#tokenAddressWithdraw').val(),
        amount: $('#amountWithdraw').val()
      }

      if (mode === 'erc1155') {
        data.tokenId = $('#tokenIdWithdraw').val()
        data.erc1155Address = $('#tokenAddressWithdraw').val()
        delete data.erc20Address
      }
      toastr.info('Processing withdraw...')
      $.ajax({
        type: 'POST',
        url: mode === 'erc20' ? '/withdrawErc20' : '/withdrawErc1155',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: (response) => {
          setIsLoading(false)
          if (response.errors) {
            toastr.error('Error withdrawing.', response.errors.join(', '))
          } else {
            toastr.success('Withdraw successful!')
          }
          fetchBalances()
          fetchSwapData()
        },
        error: (xhr) => {
          setIsLoading(false)
          toastr.error('Error starting swap. ' + xhr.responseText)
          console.error('Error during swap initiation:', xhr)
        }
      })
    })
  })
})()
