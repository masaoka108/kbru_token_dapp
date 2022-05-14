// const kbruAddr = "0x362D3a4bB7D5AF2EA25DDbcd54F782EFb7e26Ab5";  // 20220418
// const kbruAddr = "0x401F0243845587ec101cCD3Ea548F0fD1F9dF326";  // 20220509
//const kbruAddr = "0x2262Ce72572b7f06A4635E824fDa344912973A86";  // 20220509 一回元に戻したヤツ
const kbruAddr = "0xc75fc3aA4d26b820B0EF92e21e8E9e205cb8C7D8";  // 20220509 sendAmountをスマコンで保持しているVer


const supportNetworkId = 4; //RinkeBy
const supportNetworkName = 'RinkeBy';

const webURL = "https://kbru-test.web.app/index.html";


let web3, user, tokenInst, firebaseUserId;
var userInfo, toUserInfo;
var connectFlg = 0
let currentBalance;

$(document).ready(async () => {
    if(window.ethereum) { // MetaMaskが入っているか確認
    web3 = new Web3(Web3.givenProvider);

    var version = web3.version.api;

    // 既にconnect walletしていたら自動的にconnectする
    if (localStorage?.getItem('isWalletConnected') === 'true') {
      try {
        await connectWallet();
        localStorage.setItem('isWalletConnected', true)
      } catch (ex) {
        console.log(ex)
      }
    }

    showHideConnectButton(localStorage?.getItem('isWalletConnected'))


    // detect Metamask account change
    window.ethereum.on('accountsChanged', function (accounts) {
      console.log('accountsChanges',accounts);
      location.reload()
    });

     // detect Network account change
    window.ethereum.on('networkChanged', function(networkId){
      console.log('networkChanged',networkId);
      if (networkId != supportNetworkId) {
        alert(`ネットワークを${supportNetworkName}に接続して下さい`)
      }
    });
    

    // トークン送信画面の場合、toセレクトボックスを生成
    var currentFile = window.location.href.split('/').pop();
    if(currentFile == 'tokenSend.html') {
      createEditableSelect('toEditableSelect')
    }
  


  }
})

function showHideConnectButton(connect) {
  if (connect == 'true') {
    // コネクト時
    $('.userinfoForm').show()
    $('.connectWalletNav').hide()  
  } else {
    // 未コネクト時
    $('.userinfoForm').hide()
    $('.connectWalletNav').show()  
  }

}

$(".userinfoForm").click(() => {

  $('#userCreateFooter').show()
  $('#userCreateForm').show()
  $('#spanMsg').html('')

  openModal();
});

$(".btn.login").click(async () => {
  await  connectWallet();
});


$("#sendToken").click(async () => {
  console.log('alert send token');

  // ネットワーク チェック
  chainId = await web3.eth.net.getId()
  if (chainId != supportNetworkId) {
    alert(`ネットワークを${supportNetworkName}に接続して下さい`)
    return false;
  }

  var toAddress = ''

  if ($(`#toWalletAddress`).val() != '') {
    toAddress = $(`#toWalletAddress`).val()
  } else {
    if ($(`#toEditableSelect`).val() != '') {
      toAddress = $(`#toEditableSelect`).val()
    }    
  }

  // 入力チェック
  if ($("#amount").val() != '' && toAddress != '') {
    openMsgModal()
  
    amount = $("#amount").val()
    
    // トークン送信
    await transferToken(toAddress, amount)  

  } else {
    alert('「送信先ウォレットアドレス」と「送信KBRU数」を入力してください')
  }


});



// Connect Wallet function
async function connectWallet() {

  if (connectFlg == 1) {
    return false
  }

  try{
    // MetaMaskが入っているか確認

    if (!(window.ethereum && window.ethereum.isMetaMask)) {
      //入っていない場合（スマホの場合）
      launchApp()
    } else {
      // 入っている場合
    // 「接続して良いか？」を聞くPopUpを表示
      const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    })

    // network確認
    if(window.ethereum.networkVersion != supportNetworkId) {

      try {
        // switch network
        await web3.currentProvider.request({
          method: 'wallet_switchEthereumChain',
            params: [{ chainId: Web3.utils.toHex(supportNetworkId) }],
        });

        location.reload()
        
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          alert('add this chain id')
        }

        if (switchError.code === 4001) {
          alert(`このサイトではネットワークを${supportNetworkName}に切り替えてご利用ください`)
        }

      }

    }

    user = accounts[0] //アドレスを取得
    tokenInst = new web3.eth.Contract(abi.kbru, kbruAddr, { from:user }); // kbru をインスタンス化
    userInfo = await getUserInfo(user)  // Firebase ユーザー情報取得

    $(".btn.login").html("Connected") // ボタンを「Connected」に変える
    $("#ifConnectTroubleDiv").hide()  // 「Connect Walletが上手くいかない時は？」を非表示にする
    $(".userinfoForm").html(shortAddress(user)) // ウォレットアドレスを表示
    $("#userMenu").fadeIn(1000);  // ユーザーメニューを表示

    // もし新規だったユーザーだった場合は登録フォームを表示する
    if (typeof userInfo.nickname === "undefined") {
      // 完全に新規の場合

      // ウォレットアドレスだけでFirebaseに登録
      userInfo = {"walletAddress": user, "nickname": "", "profilePhoto": ""}
      await createUser(userInfo, false)

      openModal();
    } else if(userInfo.nickname == "" || userInfo.profilePhoto == "") {
      // ウォレット接続は完了しているがユーザー情報の登録が終わっていない場合
      openModal();
    } else {
      await setNickname(userInfo.nickname)  // ニックネームを表示 
      firebaseUserId = userInfo.docId       // Doc ID
    }

    setProfileImg(userInfo.profilePhoto, "profileImg") // プロフィール画像 表示
    localStorage.setItem("isWalletConnected", true);
    showHideConnectButton(localStorage?.getItem('isWalletConnected'))


    currentBalance = await getCurrentBalance(user); // 現在の所有KBRUを取得
    $(".currentBalance").html(`<span style="margin-right:5px">${currentBalance.toLocaleString()}</span>KBRU`)

    sendAmount = await getCurrentSendAmount(user)  // 送信量を更新

    tokenInst.events.Transfer({ filter: {to: user} }, (err, event) => {
      console.log('あなたにKBRUが届きました')
      console.log(`event called: ${event.event}`);
      console.log(JSON.stringify(event, null, "    "));
    });

    tokenInst.events.Transfer({ filter: {from: user} }, async (err, event) => {

      // (async () => {

      console.log('あなたがKBRUを送信しました')
      // alert('KBRUを送信しました')

      // try {

      //     // メッセージを変化させる
      //     changeModalMsg('ブロックチェーンへの書き込みが完了しました。<br>システムデータを更新中です。<br>引き続きこのままでお待ち下さい🙏')

      //     // Firebaseに履歴を保存
      //     createTokenHistory(event.returnValues.from, event.returnValues.to, event.returnValues.value)
  
      //     // 自分の currentBalance, totalSendAmount を更新
      //     await updateCurrentBalanceTotalSendAmount(event.returnValues.from)
  
      //     // 送信先ユーザーがFirebaseにいるか確認、いなければ登録する
      //     toUserInfo = await getUserInfo(event.returnValues.to.toLowerCase())
      //     if(toUserInfo.walletAddress == undefined) {
      //       userData = {
      //         "walletAddress" : event.returnValues.to.toLowerCase(),
      //         "nickname": "",
      //         "profilePhoto": "",
      //       }
      //       await createUser(userData , false, false)
      //     }
  
      //     // 送信先ユーザーの currentBalance, totalSendAmount を更新
      //     await updateCurrentBalanceTotalSendAmount(event.returnValues.to)
          
      //     // メッセージを変化させる
      //     setModalEnd()
  
      //     console.log(`event called: ${event.event}`);
      //     console.log(JSON.stringify(event, null, "    "));
  
      //     // })();
        

      // } catch (error) {
      //   alert(error.message)
      //   hideMsgModal()
      // }
    


    });

    connectFlg = 1

  }   



  } catch (error) {
    alert(error.message)
  }


}

async function updateCurrentBalanceTotalSendAmount(address, amount = 0) {
  console.log('updateCurrentBalanceTotalSendAmount start')

  // currentBalance 取得
  currentBalance = await getCurrentBalance(address)

  updateData = {
    currentBalance: currentBalance
  }

  if (amount > 0) {

    // totalSendAmount 取得
    targetUser = await getUserInfo(address)
    totalSendAmount = parseFloat(targetUser.totalSendAmount) + parseFloat(amount)

    updateData.totalSendAmount = totalSendAmount

  }

  await updateUser(address, updateData)
}

async function getTotalSendAmount(address) {
  var totalSend = 0
  tokenHistoryData = await getTokenSendHistory(kbruAddr,abi.kbru, address, 0, 'latest')

  for (let i = 0; i < tokenHistoryData.length; i++) {
    totalSend += parseFloat(tokenHistoryData[i].value)
  }

  return totalSend
}

async function getTokenTransferHistory(contractAddr, tokenAbi,fromAddress, fromBlock, toBlock) {
  // var i = 0
  var listData = []

  const contract = new web3.eth.Contract(tokenAbi, contractAddr)

  const eventsFrom = await contract.getPastEvents("Transfer", {
    fromBlock: fromBlock,
    toBlock: toBlock,
    filter: {from: fromAddress}
  })

  const eventsTo = await contract.getPastEvents("Transfer", {
    fromBlock: fromBlock,
    toBlock: toBlock,
    filter: {to: fromAddress}
  })

  const events = eventsFrom.concat(eventsTo);

  if (events) {
    for (let event of events) {

      const blockN = await web3.eth.getTransaction(event.transactionHash)
      const blockData = await web3.eth.getBlock(blockN.blockNumber)

      data = {
        from: event.returnValues.from,
        to: event.returnValues.to,
        value: web3.utils.fromWei(event.returnValues.value),
        timestamp: blockData.timestamp,
        createdAt: timestampToTime(blockData.timestamp),
      }
      console.log(data)

      listData.push(data)
      toBlock = event.blockNumber
    }

    return listData

  }

}


async function getTokenSendHistory(contractAddr, tokenAbi,fromAddress, fromBlock, toBlock) {
  var listData = []

  const contract = new web3.eth.Contract(tokenAbi, contractAddr)

  const eventsFrom = await contract.getPastEvents("Transfer", {
    fromBlock: fromBlock,
    toBlock: toBlock,
    filter: {from: fromAddress}
  })

  if (eventsFrom) {
    for (let event of eventsFrom) {

      const blockN = await web3.eth.getTransaction(event.transactionHash)
      const blockData = await web3.eth.getBlock(blockN.blockNumber)

      data = {
        from: event.returnValues.from,
        to: event.returnValues.to,
        value: web3.utils.fromWei(event.returnValues.value),
        timestamp: blockData.timestamp,
        createdAt: timestampToTime(blockData.timestamp),
      }
      console.log(data)

      listData.push(data)
      toBlock = event.blockNumber
    }

    return listData

  }

}

async function transferToken(to, amount) {

  try {

    let method = tokenInst.methods.transferKbru(to, web3.utils.toWei(amount));
    let gas = await method.estimateGas({from: user});
    console.log('estimateGas=' + gas);

    let gasPrice = await web3.eth.getGasPrice();
    console.log('gasPrice=' + gasPrice);
  
  
    const receipt = await tokenInst.methods.transferKbru(to, web3.utils.toWei(amount))
    .send(
      {
        from: user,
        gas: gas + 50000,
        gasPrice: gasPrice,
        // gas: 1500000,
        // // gasPrice: '4000000'
        // gasPrice: '80000000'
      }
    )
    .on('receipt', async function(){
      console.log('transfer end');
      // alert('transfer end')

      try {

        // メッセージを変化させる
        changeModalMsg('ブロックチェーンへの書き込みが完了しました。<br>システムデータを更新中です。<br>引き続きこのままでお待ち下さい🙏')

        // Firebaseに履歴を保存
        createTokenHistory(user, to, amount)

        // 自分の currentBalance, totalSendAmount を更新
        await updateCurrentBalanceTotalSendAmount(user, amount)

        // 送信先ユーザーがFirebaseにいるか確認、いなければ登録する
        toUserInfo = await getUserInfo(to.toLowerCase())
        if(toUserInfo.walletAddress == undefined) {
          userData = {
            "walletAddress" : to.toLowerCase(),
            "nickname": "",
            "profilePhoto": "",
          }
          await createUser(userData , false, false)
        }

        // 送信先ユーザーの currentBalance, totalSendAmount を更新
        await updateCurrentBalanceTotalSendAmount(to)
        
        // メッセージを変化させる
        setModalEnd()

      } catch (error) {
        alert(error.message)
        hideMsgModal()
      }

    });
  
  } catch (error) {
    alert(error.message)
    hideMsgModal()
  }

}

function openModal() {
    $('#mode').val('')

    try {
      var myModal = new bootstrap.Modal(document.getElementById('myModal'), {
        keyboard: false
      })
  
      if (userInfo.nickname !== undefined) {
        $('#nickname').val(userInfo.nickname)
        setProfileImg(userInfo.profilePhoto, "profileImgForm")  
        $('#mode').val('edit')      
      }
  
      myModal.show();
    } catch (ex) {
      console.log(ex)
    }

}

function setProfileImg(profilePath, target = "profileImg") {

  if(profilePath !== undefined && profilePath != "") {
    var storageRef = firebase.storage().ref();
    const gsReference = storageRef.child(profilePath);
  
    gsReference.getDownloadURL().then((downloadURL) => {
      const elements = document.getElementsByClassName(target); 
      for( let i = 0 ; i < elements.length ; i ++ ) {
        elements[i].src = downloadURL;
      }

      console.log(downloadURL)
    });
  } else {

    const elements = document.getElementsByClassName(target); 
    for( let i = 0 ; i < elements.length ; i ++ ) {
      elements[i].src = "./assets/images/default_profile_img.jpg";
    }

  }
}

async function getCurrentBalance(address) {

  const balanceRaw = await tokenInst.methods.balanceOf(address).call();  // wei表記

  const balance = parseFloat(web3.utils.fromWei(balanceRaw, "ether")) // decimal 18 を考慮

  console.log(balance);

  $("#balance").html(`あなたは<br class="br-sp"> ${balance.toLocaleString()} KBRU <br class="br-sp">持っています`)

  // もしindex.htmlなら users.currentBalanceを更新
  var currentFile = window.location.href.split('/').pop();
  if(currentFile == 'index.html') {
    // users の currentBalanceを更新      
    updateUser(address, {currentBalance: balance})
    // currentBalance
  }

  return new Promise(async (resolve, reject) => {
    resolve(balance)
  })  

}

async function getCurrentSendAmount(address) {

  const sendAmountRaw = await tokenInst.methods.sendAmountOf(address).call();  // wei表記
  const sendAmount = parseFloat(web3.utils.fromWei(sendAmountRaw, "ether")) // decimal 18 を考慮

  console.log(sendAmount);

  // もしindex.htmlなら users.totalSendAmount を更新
  var currentFile = window.location.href.split('/').pop();
  if(currentFile == 'index.html') {
    // users の currentBalanceを更新
    updateUser(address, {totalSendAmount: sendAmount})
  }

  return new Promise(async (resolve, reject) => {
    resolve(sendAmount)
  })  

}

function launchApp() {

  if (
    navigator.userAgent.indexOf('iPhone') > 0
    || navigator.userAgent.indexOf('iPad') > 0
    || navigator.userAgent.indexOf('iPod') > 0
  )
  {
    document.location = "https://metamask.app.link/dapp/kbru-test.web.app/";

  }
  else if(navigator.userAgent.indexOf('Android') > 0)
  {
      document.location = "metamask://dapp/kbru-test.web.app"
      var time = (new Date()).getTime();
      setTimeout(function(){
          var now = (new Date()).getTime();
 
          if((now-time)<400) {
                  document.location = "https://metamask.app.link/dapp/kbru-test.web.app/";
          }
      }, 300);
 
  } 
  else {
    document.location = "metamask://dapp/kbru-test.web.app"
    var time = (new Date()).getTime();
    setTimeout(function(){
        var now = (new Date()).getTime();

        if((now-time)<400) {
                document.location = "https://metamask.app.link/dapp/kbru-test.web.app/";
        }
    }, 300);

  }

  var time = (new Date()).getTime();
  setTimeout(function(){
      var now = (new Date()).getTime();

      if((now-time)<400) {
              document.location = "https://apps.apple.com/jp/app/metamask-blockchain-wallet/id1438144202";
      }
  }, 300);


};