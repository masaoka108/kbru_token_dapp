const firebaseConfig = {
  apiKey: "AIzaSyCeG7Ak-8UgNYDSHnzQD53A0zTHPc6AKmM",
  authDomain: "kbru-test.firebaseapp.com",
  projectId: "kbru-test",
  storageBucket: "kbru-test.appspot.com",
  messagingSenderId: "372804501342",
  appId: "1:372804501342:web:8b8c7af9468b3b6e0359cf",
  measurementId: "G-EF2405NTQN"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
var storage = firebase.storage();


async function getUserInfo(address) {
  _userInfo = {}

  return new Promise(async (resolve, reject) => {

    try {

      const querySnapshot = await db.collection("users").where("walletAddress", "==", address).get()
        .then(querySnapshot => {
            console.log('thenの中')
            querySnapshot.forEach((doc) => {

              console.log(doc.id, " => ", doc.data());
              _userInfo = doc.data()
              _userInfo.docId = doc.id
          });
          resolve(_userInfo)
        })
    
    } catch (error) {
      console.log("Error getting documents: ", error);
    }
  })
}


async function setNickname(nickname) {
  $(".username").html(`(${nickname})`)
}

async function createUser(userData, changeMsg = true, showUserData = true) {
  try {
    userData.rankingShow = 1 // デフォルトで1
    userData.position = ""  // デフォルトは空

    const db = firebase.firestore();
    const docRef = await db.collection("users").add(userData);
    console.log("CreateUser Document written with ID: ", docRef.id);
    userInfo.docId = docRef.id

    if (showUserData) {
      await setNickname($('#nickname').val())
      setProfileImg(userData.profilePhoto)
    }

    if (changeMsg) {
      showMsg()
    }
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}

async function editUser(userData) {
  try {
    // const db = firebase.firestore();
    // const docRef = await db.collection("users").add(userData);
    // console.log("CreateUser Document written with ID: ", docRef.id);

    const userRef = db.collection('users').doc(userInfo.docId)
    await userRef.update(userData)

    userInfo = await getUserInfo(user)

    await setNickname($('#nickname').val())
    // if (userData.profilePhoto !== undefined && userData.profilePhoto != "" ) {
    setProfileImg(userInfo.profilePhoto)
    // }

    showMsg()
  } catch (error) {
    console.error("Error adding document: ", error);
  }
}

async function putStorage(file, mode) {

    //ファイルの参照
    var storageRef = firebase.storage().ref();

    //ファイルのメタデータ
    var metadata = {
      contentType: "image/*",
    };          

    //画像ファイルのアップロード
    profileImagePath = ""

    // profilePhoto = "profile/" + `${userInfo.docId}_` + file.name
    profilePhoto = `profile/${userInfo.docId}/${file.name}`

    const uploadTask = storageRef.child(`profile/${userInfo.docId}/${file.name}`).put(file, metadata);
    console.log(uploadTask);

    await uploadTask.on(
      "state_changed",
      async function (snapshot) {
        
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED: // or 'paused'
            console.log("Upload is paused");
            break;
          case firebase.storage.TaskState.RUNNING: // or 'running'
            console.log("Upload is running");
            break;
        }

        // if (progress === 100 && flg === 0) {
        if (progress === 100) {
          console.log("100%です。");
          // profileImagePath = snapshot.metadata.fullPath
          profileImagePath = profilePhoto

          // var display = document.querySelector(".disN");
          // display.classList.replace("disN", "disB");
          // flg = 1;


          // データを Firestoreに登録
          userData = {
            // nickname: $('#nickname').val(),
            // walletAddress: user,
            profilePhoto: profileImagePath
          }

          if (mode == 'edit') {
            editUser(userData)  // 実質 edit にしか来ない
          } else {  
            createUser(userData)
          }

        }
      },
      function (error) {
        switch (error.code) {
          case "storage/unauthorized":
            // User doesn't have permission to access the object
            console.log(
              "目的の操作を行う権限がユーザーにありません。セキュリティ ルールが正しいことをご確認ください。"
            );
            break;

          case "storage/canceled":
            // User canceled the upload
            console.log("ユーザーがオペレーションをキャンセルしました。");
            break;

          case "storage/unknown":
            // Unknown error occurred, inspect error.serverResponse
            console.log("不明なエラーが発生しました。");
            break;
          default:
            console.log("error");
            break;
        }
      }
    );

  // return profileImagePath

}

async function createTokenHistory(from, to, value) {

  (async () => {
    try {
      const db = firebase.firestore();
      const docRef = await db.collection("tokenHistories").add({
        from: from,
        to: to,
        value: value,
        createdAt: getNow(),
        updatedAt: getNow()
      });
      console.log("createTokenHistory Document written with ID: ", docRef.id);

    } catch (error) {
      console.error("Error adding document: ", error);
    }
  })();
}


async function updateUser(address, updateData){

  try {
    const db = firebase.firestore();

    const querySnapshot = await db.collection("users").where("walletAddress", "==", address.toLowerCase()).get()
      .then(querySnapshot => {
          querySnapshot.forEach((doc) => {

            console.log(doc.id, " => ", doc.data());

            var userRef = db.collection("users").doc(doc.id);
      
            return userRef.update(updateData)
            .then(() => {
                console.log("Document successfully updated!");
            })
            .catch((error) => {
                // The document probably doesn't exist.
                console.error("Error updating document: ", error);
            });

        });
          return null;
      })
    
  } catch (error) {
    console.error("Error adding document: ", error);
  }


}

async function getAndShowRaning(pageSize) { 
  var i = 0
  
  const querySnapshot = await db.collection("users").where("rankingShow", "!=", 0).orderBy("rankingShow").orderBy("currentBalance", "desc").limit(pageSize).get()
  .then(querySnapshot => {
      querySnapshot.forEach((doc) => {

        console.log(doc.id, " => ", doc.data());

        // var userRef = db.collection("users").doc(doc.id);
  
        // return userRef.update(updateData)
        // .then(() => {
        //     console.log("Document successfully updated!");
        // })
        // .catch((error) => {
        //     // The document probably doesn't exist.
        //     console.error("Error updating document: ", error);
        // });


        // $('#rankingList').append(`
        //   <div class="u-container-style u-list-item u-repeater-item u-white u-list-item-1">
        //   <div class="u-container-layout u-similar-container u-container-layout-1">
        //     <h2 class="u-text u-text-1">${i + 1}位&nbsp; ${doc.data().currentBalance.toLocaleString()} KBRU</h2>
        //     <div class="u-clearfix u-expanded-width u-gutter-0 u-layout-wrap u-layout-wrap-1">
        //       <div class="u-layout">
        //         <div class="u-layout-row">
        //           <div class="u-container-style u-layout-cell u-size-30 u-layout-cell-1">
        //             <div class="u-container-layout u-container-layout-2">
        //               <img class="u-image u-image-default u-preserve-proportions u-image-2 rankingProfile_${i}" src="" alt="" data-image-width="92" data-image-height="74">
        //             </div>
        //           </div>
        //           <div class="u-container-style u-layout-cell u-size-30 u-layout-cell-2">
        //             <div class="u-container-layout u-container-layout-3">
        //               <p class="u-text u-text-default u-text-2">
        //                 <span style="font-size: 2.25rem; font-weight: 700;">${doc.data().nickname}</span><br>
        //                 <span style="font-size: 1rem; font-weight: 700;">${shortAddress(doc.data().walletAddress)}</span>
        //               </p>
        //             </div>
        //           </div>
        //         </div>
        //       </div>
        //     </div>
        //   </div>
        // </div>
        // `)

        $('#rankingList').append(`
  
            <div style="background-color:#C9CACA; display:flex; align-items:center; border-radius: 30px;  margin-bottom:20px; padding: 8px 30px; font-family:hiragino-w8;">
              <div>
                <img style="width:40px; margin-right:20px" class="rankingProfile_${i} rankingProfile" src="" alt="">
              </div>
              <div>
                <div>
                  <span style="margin-right:5px">${i + 1}位</span>${doc.data().nickname}
                </div>
                <div style="color:white; font-family:hiragino-w6">
                <span style="margin-right:5px">${doc.data().currentBalance.toLocaleString()}</span>KBRU
                </div>
              </div>
            </div>
        `)




        // if (doc.data().profilePhoto != "") {
          setProfileImg(doc.data().profilePhoto, `rankingProfile_${i}`)        
        // } else {
        //   // デフォルトのプロフィール画像を設定
        // }

        i++

    });
      return null;
  })


}

async function createEditableSelect(targetId) {

  return new Promise(async (resolve, reject) => {

    try {

      const querySnapshot = await db.collection("users").where("walletAddress", "!=", user).get()
        .then(querySnapshot => {
            querySnapshot.forEach((doc) => {

              console.log(doc.id, " => ", doc.data());
              _userInfo = doc.data()
              _userInfo.docId = doc.id

              if (_userInfo.nickname != "") {
                // $('#' + targetId).append($('<option>').html(_userInfo.nickname).val(_userInfo.walletAddress));
                // $('#' + targetId).editableSelect('add', _userInfo.nickname, [0, [{"attr":"ccc"}, [{"aaa": "bbb"}]]]);
                $('#' + targetId).editableSelect('add', `${_userInfo.nickname} (${_userInfo.walletAddress})`, 1, {}, {"address": _userInfo.walletAddress});
              }
          });
          resolve(_userInfo)
        })
    
    } catch (error) {
      console.log("Error getting documents: ", error);
    }
  })


}


$(function() {
  $('#userCreate').on('click', async function() {
    console.dir(app);

    try {
      // 画像をFirebase Storageに登録
      const file = document.getElementById("profileImage").files[0];

      if (file !== undefined) {
        profileImagePath = await putStorage(file, $('#mode').val()) // この中でFirebase users.profilePhoto へのupdateも行なっている
      }

      await editUser({
        nickname: $('#nickname').val(),
        walletAddress: user,
      })
      
    } catch (error) {
      alert(error);
      console.log("Error getting documents: ", error);
    }

  });

})