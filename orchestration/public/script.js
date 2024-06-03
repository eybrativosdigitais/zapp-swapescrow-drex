// const erc20TokenAddress = "0x42114b089B6b561F843D337A40aF9aD882CebaA1";
// const erc1155TokenAddress = "0x2B1220a1612BE827DA9526a678F2305048f3D3F6";

async function initializeEnvironment() {
  try {
    const response = await fetch('/stats');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to initialize environment:', error);
  }
}

function generateInfoTableRow(key, value) {
  return `<div class="flex justify-between px-6">
<span class="font-bold font-medium">
  ${key}
</span>
<span class="text-sm flex items-center justify-center">
  &nbsp;${value}
</span>
</div>`;
}

(async function () {
  const response = await initializeEnvironment();

  $('#tokenInfoTable').append(generateInfoTableRow("ERC20 Token: ", response.tokens.ERC20));
  $('#tokenInfoTable').append(generateInfoTableRow("ERC1155 Token: ", response.tokens.ERC1155));
  $('#tokenAllowanceTable').append(generateInfoTableRow("ERC20 Token: ", response.allowances.ERC20));
  $('#tokenAllowanceTable').append(generateInfoTableRow("ERC1155 Token: ", response.allowances.ERC1155));
  $('#processEnvTable').append(generateInfoTableRow("Own Address: ", response.ownAddress));
  $('#processEnvTable').append(generateInfoTableRow("RPC URL: ", response.rpcUrl));
  $('#processEnvTable').append(generateInfoTableRow("Gas Price: ", response.gasPrice));
  $('#processEnvTable').append(generateInfoTableRow("Gas Limit: ", response.gasLimit));
  $('#chainInfoTable').append(generateInfoTableRow("Own Public Key: ", response.ownPublicKey));
  $('#chainInfoTable').append(generateInfoTableRow("Swap ID Counter: ", response.swapIdCounter));
  $('#chainInfoTable').append(generateInfoTableRow("Latest Root: ", response.latestRoot));

  const swapSender = response.ownAddress;
  const currentBank = response.ownAddress;

  const erc20TokenAddress = response.tokens.ERC20;
  const erc1155TokenAddress = response.tokens.ERC1155;

  const isBesu = !window.location.href.includes(':300');
  const balanceERC201 = erc20TokenAddress;
  const balanceERC20TestAddress = isBesu ? "0x94e739DB09F76F5Aa80E282eC6c4dD7dDb529ea1" : "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";

  let mode = 'erc20';
  let modeTo = 'ToErc1155';

  function showHideFields() {
    const modeCombined = mode + modeTo;

    const fieldConfig = {
      erc20ToErc20: {
        hide: ['#tokenIdSentInput', '#tokenIdSentAmountInput', '#tokenIdReceivedInput', '#labelTokenIdReceived', '#labelTokenIdSentAmount', '#labelTokenIdSent'],
        show: ['#labelErc20AddressReceived', '#labelTokenReceivedAmount', '#tokenReceivedAmountInput', '#erc20AddressReceivedInput', '#swapTokenAddressInput', '#amountSentInput'],
      },
      erc20ToErc1155: {
        hide: ['#tokenIdSentInput', '#tokenIdSentAmountInput', '#labelErc20AddressReceived', '#erc20AddressReceivedInput', '#tokenReceivedAmountInput', '#labelTokenIdSentAmount', '#labelTokenIdSent'],
        show: ['#tokenIdReceivedInput', '#amountSentInput', '#swapTokenAddressInput', '#tokenReceivedAmountInput', '#labelAmountSent', '#labelTokenIdReceived'],
      },
      erc1155ToErc20: {
        hide: ['#tokenIdSentAmountInput', '#labelTokenIdSentAmount', '#erc20AddressReceivedInput', '#tokenIdReceivedInput', '#labelErc20AddressReceived', '#labelTokenIdReceived'],
        show: ['#tokenIdSentInput', '#swapTokenAddressInput', '#amountSentInput', '#tokenReceivedAmountInput', '#amountReceivedInput', '#labelTokenIdSent', '#labelAmountSent'],
      },
      erc1155ToErc1155: {
        hide: ['#amountSentInput', '#erc20AddressReceivedInput', '#swapTokenAddressInput', '#labelAmountSent'],
        show: ['#tokenIdSentInput', '#tokenIdSentAmountInput', '#tokenIdReceivedInput', '#tokenReceivedAmountInput', '#labelTokenIdSent', '#labelTokenIdSentAmount', '#labelTokenIdReceived'],
      },
    };

    function applyClasses(fieldArray, action) {
      fieldArray.forEach(selector => {
        $(selector)[action]('hidden');
      });
    }

    const config = fieldConfig[modeCombined];
    if (config) {
      applyClasses(config.hide, 'addClass');
      applyClasses(config.show, 'removeClass');
    }
  }

  $('#erc20Tab').click(function () {
    $('#tokenAddressDeposit').removeClass('hidden');
    // parentelement tokenAddressDeposit
    $('#tokenAddressDeposit').parent().removeClass('hidden');
    $('#labelTokenAddress').removeClass('hidden');
    $('#tokenAddressDeposit').val('');
    // $('#swapTokenAddress').val(erc20TokenAddress);
    // $('#tokenAddressWithdraw').val(erc20TokenAddress);
    $('#erc20Tab').attr('aria-selected', true);
    $('#erc1155Tab').attr('aria-selected', false);
    $('#tokenIdInput').addClass('hidden');
    $('#tokenIdErc1155').addClass('hidden');
    $('#labeltokenIdErc1155').addClass('hidden');
    mode = 'erc20';
    showHideFields();
  });
  $('#erc20Tab').click();

  $('#erc1155Tab').click(function () {
    $('#tokenAddressDeposit').val(erc1155TokenAddress);
    $('#tokenAddressDeposit').addClass('hidden');
    $('#tokenAddressDeposit').parent().addClass('hidden');
    $('#labelTokenAddress').addClass('hidden');
    $('#swapTokenAddress').val(erc1155TokenAddress);
    $('#tokenAddressWithdraw').val(erc1155TokenAddress);
    $('#erc20Tab').attr('aria-selected', false);
    $('#erc1155Tab').attr('aria-selected', true);
    $('#tokenIdInput').removeClass('hidden');
    $('#tokenIdErc1155').removeClass('hidden');
    $('#labeltokenIdErc1155').removeClass('hidden');
    mode = 'erc1155';
    showHideFields();
  });

  // Event listeners for receiving tabs
  $('#erc20TabTo').click(function () {
    modeTo = 'ToErc20';
    $('#erc20TabTo').attr('aria-selected', true);
    $('#erc1155TabTo').attr('aria-selected', false);
    showHideFields();
  });

  $('#erc1155TabTo').click(function () {
    modeTo = 'ToErc1155';
    $('#erc1155TabTo').attr('aria-selected', true);
    $('#erc20TabTo').attr('aria-selected', false);
    showHideFields();
  });
  $('#erc1155TabTo').click();


  function refreshBalance() {

    // TODO: change the hardcoded erc20 addresses and erc1155
    $.ajax({
      type: "GET",
      url: `/shielded-balance?erc20Tokens[]=${balanceERC201}&erc20Tokens[]=${balanceERC20TestAddress}&erc1155TokenIds[]=1&erc1155TokenIds[]=2&erc1155TokenIds[]=3`,
      contentType: "application/json", // Set the content type to JSON
      success: function (response) {
        // Iterate over the ERC20 token balances
        const erc20Balances = response.balances.balances;
        Object.keys(erc20Balances).forEach(function (key) {
          const balance = parseFloat(erc20Balances[key]).toFixed(2);
          $('#erc20ShildedBalanceContainer').append(`
          <div class="flex justify-between">
            <span>Saldo de ERC20 ${humanizeAddress(key)}:</span>
            <span>${balance}</span>
          </div>
        `);
        });

        // Iterate over the ERC1155 token balances
        const erc1155Balances = response.balances.tokenOwners;
        Object.keys(erc1155Balances).forEach(function (key) {
          const balance = parseFloat(erc1155Balances[key]).toFixed(2);
          $('#erc20ShildedBalanceContainer').append(`
          <div class="flex justify-between">
            <span>Quantidade de Titulos Públicos (ID: ${key}):</span>
            <span>${balance}</span>
          </div>
        `);
        });
      },
      error: function () {
        console.log('Error getting balance');
      }
    });

    $.ajax({
      type: "GET",
      url: `/token-balance?token=${balanceERC201}`,
      contentType: "application/json", // Set the content type to JSON
      success: function (response) {
        // BRL currency formatter
        const res = ethers.utils.formatUnits(response.balance.raw, 2);

        $('#erc20BalanceContainer').append(`
          <div class="flex justify-between">
          <span>Saldo de ERC20 ${humanizeAddress(balanceERC201)}</span>
          <span id="erc20Balance1">${numberFormatter.format(res)}</span>
        </div>
      `);
      },
      error: function () {
        console.log('Error get Balance');
      }
    });

    $.ajax({
      type: "GET",
      url: `/token-balance?token=${balanceERC20TestAddress}`,
      contentType: "application/json", // Set the content type to JSON
      success: function (response) {
        // BRL currency formatter
        const res = ethers.utils.formatUnits(response.balance.raw, 2);
        $('#erc20BalanceContainer').append(`
          <div class="flex justify-between">
          <span>Saldo de ERC20 ${humanizeAddress(balanceERC20TestAddress)}</span>
          <span id="erc20Balance2">${numberFormatter.format(res)}</span>
        </div>
      `);
        // $('#erc20ShildedBalance2').text(parseFloat(response.balance.formatted));
      },
      error: function () {
        console.log('Error get Balance');
      }
    });

    $.ajax({
      type: "GET",
      url: `/token-balance?token=${erc20TokenAddress}`,
      contentType: "application/json", // Set the content type to JSON
      success: function (response) {
        // BRL currency formatter
        $('#erc20Balance').text(brlFormatter.format(parseFloat(response.balance.formatted)));
      },
      error: function () {
        console.log('Error get Balance');
      }
    });
  }

  const copyIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
</svg>
`

  $(document).ready(function () {
    let uniqueData = []; // Store the fetched data

    // $('.money').mask('#.##0,00', { reverse: true });

    $.ajax({
      type: "GET",
      // url: `/getAllCommitments`,
      url: `/parsedCommitment?erc20Tokens[]=${balanceERC201}&erc20Tokens[]=${balanceERC20TestAddress}&erc1155TokenIds[]=1&erc1155TokenIds[]=2`,
      contentType: "application/json", // Set the content type to JSON
      success: function (response) {
        // Clear any existing rows
        $('#commitmentsTable').empty();
        const nameClasses = {
          'balances': 'bg-blue-500 text-white',
          'tokenOwners': 'bg-green-500 text-white',
          'swapProposals': 'bg-yellow-500 text-white'
        };

        response.commitments.forEach(commitment => {
          const nameClass = nameClasses[commitment.name] || 'bg-gray-500 text-white';
          const preimageValue = typeof commitment.preimage.value === 'object' ? 'Detalhes' : numberFormatter.format(commitment.preimage.value);
          const preimageClass = typeof commitment.preimage.value === 'object' ? 'text-blue-500 underline accordion cursor-pointer' : '';

          $('#commitmentsTable').append(`
     <tr>
         <td class="px-6 py-4 whitespace-nowrap text-sm flex font-medium text-gray-900">
             ${shortenString(commitment._id)}
             <span class="copy-btn" onclick="copyToClipboard('${commitment._id}')">${copyIconSVG}</span>
         </td>
         <td class="px-6 py-4 whitespace-nowrap text-sm text-center"><div class="${nameClass} w-auto text-center rounded-full px-3 py-1">${commitment.name}</div></td>
         <td class="px-6 py-4 whitespace-nowrap text-sm flex text-gray-500">
             ${shortenString(commitment.mappingKey)}
             <span class="copy-btn" onclick="copyToClipboard('${commitment.mappingKey}')">${copyIconSVG}</span>
         </td>
         <td class="px-6 py-4 whitespace-nowrap text-sm ${preimageClass}">${preimageValue}</td>
         <td class="px-6 py-4 whitespace-nowrap text-sm ${commitment.isNullified ? 'text-red-600' : 'text-green-600'}">${commitment.isNullified}</td>
     </tr>
     <tr class="panel hidden transition">
     <td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
         <div class="panel-content">
             <h4 class="font-semibold mb-2">Detalhes</h4>
             ${typeof commitment.preimage.value === 'object' ? `
                 <div>
                     <p><strong>Swap Amount Sent:</strong> ${formatNumber(commitment.preimage.value.swapAmountSent)}</p>
                     <p><strong>Swap Amount Received:</strong> ${formatNumber(commitment.preimage.value.swapAmountRecieved)}</p>
                       <p><strong>Swap Token Sent ID:</strong> ${commitment.preimage.value.swapTokenSentId}</p>
                       <p><strong>Swap Token Sent Amount:</strong> ${formatNumber(commitment.preimage.value.swapTokenSentAmount)}</p>
                       <p><strong>Swap Token Received ID:</strong> ${commitment.preimage.value.swapTokenRecievedId}</p>
                       <p><strong>Swap Token Received Amount:</strong> ${formatNumber(commitment.preimage.value.swapTokenRecievedAmount)}</p>
                       <p><strong>Swap ID:</strong> ${commitment.preimage.value.swapId}</p>
                       <p><strong>Swap Sender:</strong> ${commitment.preimage.value.swapSender, 15}</p>
                       <p><strong>Swap Receiver:</strong> ${commitment.preimage.value.swapReciever, 15}</p>
                       <p><strong>ERC20 Address Sent:</strong> ${commitment.preimage.value.erc20AddressSent, 15}</p>
                       <p><strong>ERC20 Address Received:</strong> ${commitment.preimage.value.erc20AddressRecieved}</p>
                       <p><strong>Pending Status:</strong> ${commitment.preimage.value.pendingStatus}</p>
                   </div>
               ` : `
                   <p><strong>Value:</strong> ${formatNumber(commitment.preimage.value)}</p>
               `}
           </div>
         </td>
     </tr>
 `);
        });

        $('.accordion').click(toggleAccordion);

      },
      error: function () {
        console.log('Error get Balance');
      }
    });

    function fetchSwapData() {
      const fetchData = (params) => {
        return $.ajax({
          url: '/swap',
          type: 'GET',
          data: params
        });
      };

      setIsLoading(true);
      $.when(
        fetchData({ swapSender: swapSender }),
        fetchData({ swapReceiver: swapSender })
      ).done((senderResponse, receiverResponse) => {
        setIsLoading(false);
        const senderData = senderResponse[0].commitments;
        const receiverData = receiverResponse[0].commitments;

        const combinedData = [
          ...senderData,
          ...receiverData,
        ];

        uniqueData = combinedData.reduce((acc, item) => {
          const existingItemIndex = acc.findIndex(accItem => accItem.preimage.value.swapId === item.preimage.value.swapId);
          if (existingItemIndex > -1) {
            if (item.preimage.value.pendingStatus === "0") {
              acc[existingItemIndex] = item;
            }
          } else {
            acc.push(item);
          }
          return acc;
        }, []);

        renderSwapTable(uniqueData);
      }).fail(function (error) {
        setIsLoading(false);
        console.error('Error fetching swap data:', error);
      });
    }
    function renderSwapTable(data) {
      $('#swapTableBody').empty();

      const selectedStatus = $('#statusFilter').val();
      const filteredData = selectedStatus ? data.filter(item => {
        let statusText;
        switch (item.preimage.value.pendingStatus) {
          case "0":
            statusText = "Completed";
            break;
          case "1":
            statusText = "Open";
            break;
          case "2":
            statusText = "Cancelled";
            break;
          default:
            statusText = "Unknown";
        }
        return statusText === selectedStatus;
      }) : data;

      filteredData.forEach(item => {
        let statusText, statusClass;
        switch (item.preimage.value.pendingStatus) {
          case "0":
            statusText = "Completed";
            statusClass = "bg-green-200 text-green-800";
            break;
          case "1":
            statusText = "Open";
            statusClass = "bg-blue-200 text-blue-800";
            break;
          case "2":
            statusText = "Cancelled";
            statusClass = "bg-red-200 text-red-800";
            break;
          default:
            statusText = "Unknown";
            statusClass = "bg-gray-200 text-gray-800";
        }
        const swapReceiver = item.preimage.value.swapReciever;
        const swapSender = item.preimage.value.swapSender;
        const endpoint = generateEndpointCompleteSwap(item);
        let actionButton = '';
        if (statusText !== "Completed") {
          actionButton = swapReceiver.toLowerCase() === currentBank.toLowerCase() ?
            `<button class="complete-swap inline-flex items-center justify-center text-[12px] font-medium bg-green-500 text-white hover:bg-green-700 rounded h-10 px-4 py-2" data-swap-id="${item.preimage.value.swapId}" data-endpoint="${endpoint}">
            Completar Swap
          </button>` :
            `<button class="cancel-swap inline-flex items-center justify-center text-[12px] font-medium bg-red-500 text-white hover:bg-red-700 rounded h-10 px-4 py-2" data-swap-id="${item.preimage.value.swapId}"  data-endpoint="${endpoint}">
            Cancel Swap
          </button>`;
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
      `);
      });


      $('.complete-swap').click(function () {
        const swapId = $(this).data('swap-id');
        const endpoint = $(this).data('endpoint');
        completeSwap(endpoint, swapId);
      });

      $('.cancel-swap').click(function () {
        const swapId = $(this).data('swap-id');
        cancelSwap(swapId);
      });
    }

    $('#statusFilter').change(function () {
      renderSwapTable(uniqueData);
    });

    function cancelSwap(swapId) {
      setIsLoading(true);
      toastr.info('Cancelling swap...');
      $.ajax({
        type: "POST",
        url: "/cancelSwap",
        data: JSON.stringify({ swapId }),
        contentType: "application/json",
        success: function (response) {
          console.log(response);
          if (response.errors) {
            toastr.error('Error cancelling swap.', response.errors.join(', '));
          } else {
            toastr.success('Swap cancelled successfully!');
          }
          setIsLoading(false);
          fetchSwapData();
        },
        error: function (xhr) {
          toastr.error('Error cancelling swap. ' + xhr.responseText);
          console.error('Error during swap cancellation:', xhr);
          setIsLoading(false);
          fetchSwapData();
        }
      });
    }


    function completeSwap(endpoint, swapId) {
      setIsLoading(true);
      toastr.info('Completing swap...');
      $.ajax({
        type: "POST",
        url: endpoint,
        data: JSON.stringify({ swapId }),
        contentType: "application/json",
        success: function (response) {
          console.log(response);
          if (response.errors) {
            toastr.error('Error completing swap.', response.errors.join(', '));
          } else {
            toastr.success('Swap completed successfully!');
          }
          setIsLoading(false);
          refreshBalance(); // Assuming this function updates some UI elements with new balances
          fetchSwapData();
        },
        error: function (xhr) {
          toastr.error('Error completing swap. ' + xhr.responseText);
          console.error('Error during swap completion:', xhr);
          setIsLoading(false);
          fetchSwapData();
        }
      });
    }

    refreshBalance();
    fetchSwapData();
    // General function to handle form submissions
    function handleFormSubmission(url, dataExtractor) {
      setIsLoading(true);
      toastr.info('Processing deposit...');

      const jsonData = JSON.stringify(dataExtractor());

      $.ajax({
        type: "POST",
        url: url,
        data: jsonData,
        contentType: "application/json",
        success: function (response) {
          setIsLoading(false);
          console.log(response);
          refreshBalance();
          if (response.errors) {
            toastr.error('Error depositing tokens.', response.errors.join(', '));
          } else {
            toastr.success('Deposit successful!');
          }
        },
        error: function (xhr) {
          setIsLoading(false);
          const errorMsg = xhr.responseText ? xhr.responseText.substring(0, 100) : "Unexpected error";
          toastr.error(`Error depositing tokens.Details: ${errorMsg}`);
          console.error(`Error during ${url} request`, xhr);
        }
      });
    }

    // Extractor functions for different forms
    function getErc20Data() {
      return {
        erc20Address: $('#tokenAddressDeposit').val(),
        amount: parseFloat($('#amountDeposit').val())
      };
    }

    function getErc1155Data() {
      return {
        tokenId: $('#tokenIdErc1155').val(),
        amount: parseFloat($('#amountDeposit').val()),
        erc1155Address: $('#tokenAddressDeposit').val()
      };
    }

    $("#depositButton").click(function () {
      if (mode === 'erc20') {
        handleFormSubmission('/depositErc20', getErc20Data);
        return;
      }
      handleFormSubmission('/depositErc1155', getErc1155Data);
    });

    // Adjust visibility of token ID and amount fields based on the selected mode
    // Handle form submission
    $('#startSwapButton').click(function () {
      toastr.info('Starting swap...');
      setIsLoading(true);

      const combined = mode + modeTo;
      let endpoint = {
        "erc20ToErc20": "/startSwapFromErc20ToErc20",
        "erc20ToErc1155": "/startSwapFromErc20ToErc1155",
        "erc1155ToErc20": "/startSwapFromErc1155ToErc20",
        "erc1155ToErc1155": "/startSwapFromErc1155ToErc1155"
      }
      let data = {
        erc20Address: $('#swapTokenAddress').val(),
        counterParty: $('#counterParty').val(),
        amountSent: parseFloat($('#amountSent').val()),
        tokenIdReceived: parseFloat($('#tokenIdReceived').val()),
        tokenReceivedAmount: parseFloat($('#tokenReceivedAmount').val()),
      };

      if (combined === 'erc20ToErc20') {
        data = {
          "erc20AddressSent": $('#swapTokenAddress').val(),
          "erc20AddressReceived": $('#erc20AddressReceived').val(),
          "counterParty": $('#counterParty').val(),
          "amountSent": parseFloat($('#amountSent').val()),
          "amountReceived": parseFloat($('#tokenReceivedAmount').val())
        }
      } else if (combined === 'erc1155ToErc1155') {
        data = {
          "counterParty": $('#counterParty').val(),
          "tokenIdSent": $('#tokenIdSent').val(),
          "tokenSentAmount": $('#tokenIdSentAmount').val(),
          "tokenIdReceived": $('#tokenIdReceived').val(),
          "tokenReceivedAmount": $('#tokenReceivedAmount').val()
        }
      } else if (combined === "erc1155ToErc20") {
        data = {
          "erc20Address": $('#swapTokenAddress').val(),
          "counterParty": $('#counterParty').val(),
          "amountReceived": parseFloat($('#tokenReceivedAmount').val()),
          "tokenIdSent": $('#tokenIdSent').val(),
          "tokenSentAmount": $('#amountSent').val()
        }
      }

      $.ajax({
        type: "POST",
        url: endpoint[combined],
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function (response) {
          setIsLoading(false);
          if (response.errors) {
            toastr.error('Error starting swap.', response.errors.join(', '));
          } else {
            toastr.success('Swap started successfully!');
          }
          console.log(response);
          refreshBalance(); // Assuming this function updates some UI elements with new balances
          fetchSwapData();
        },
        error: function (xhr) {
          setIsLoading(false);
          toastr.error('Error starting swap. ' + xhr.responseText);
          console.error('Error during swap initiation:', xhr);
        }
      });
    });

    // Handle form submission
    $('#withdrawButton').click(function () {
      setIsLoading(true);
      const data = {
        erc20Address: $('#tokenAddressWithdraw').val(),
        amount: $('#amountWithdraw').val(),
      };

      if (mode === 'erc1155') {
        data.tokenId = $('#tokenIdWithdraw').val();
        data.erc1155Address = $('#tokenAddressWithdraw').val();
        delete data.erc20Address;
      }
      toastr.info('Processing withdraw...');
      $.ajax({
        type: "POST",
        url: mode === 'erc20' ? "/withdrawErc20" : "/withdrawErc1155",
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function (response) {
          setIsLoading(false);
          if (response.errors) {
            toastr.error('Error withdraw.', response.errors.join(', '));
          } else {
            toastr.success('Withdraw successfully!');
          }
          console.log(response);
          refreshBalance(); // Assuming this function updates some UI elements with new balances
          fetchSwapData();
        },
        error: function (xhr) {
          setIsLoading(false);
          toastr.error('Error starting swap. ' + xhr.responseText);
          console.error('Error during swap initiation:', xhr);
        }
      });
    });
  });

})();
