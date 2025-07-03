(window.near = new (function t() {
  var senderWallet = this;
  !(function (t, e) {
    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
  })(this, t),
    (this.on = function (t, e) {
      senderWallet.callbacks[t] = e;
    }),
    (this.remove = function (t) {
      senderWallet.callbacks[t] = null;
    }),
    (this.getAccountId = function () {
      return senderWallet.accountId;
    }),
    (this.isSignedIn = function () {
      var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
        e = t || {},
        n = e.contractId,
        i = e.methodNames;
      if (!n) return !!senderWallet.authData.accountId;
      if (senderWallet.authData.allKeys && senderWallet.authData.allKeys[n]) {
        var o = !1,
          s = senderWallet.authData.allKeys[n];
        return (
          s.forEach(function (t) {
            "".concat(t.methodNames) === "".concat(i || null) && (o = !!t.accessKey);
          }),
          o
        );
      }
      return !1;
    }),
    (this.account = function () {
      return senderWallet.__account;
    }),
    (this.requestSignIn = function (t) {
      var e = t.contractId,
        n = t.methodNames,
        i = t.amount,
        o = t.createNew;
      return senderWallet.request({
        method: "signin",
        params: {
          contractId: e,
          methodNames: n,
          amount: i,
          createNew: o,
        },
      });
    }),
    (this.signOut = function () {
      var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
        e = t.contractId,
        n = t.methodNames;
      return senderWallet.disconnect({
        contractId: e,
        methodNames: n,
      });
    }),
    (this.disconnect = function () {
      var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
        e = t.contractId,
        n = t.methodNames;
      return senderWallet.request({
        method: "signout",
        params: {
          contractId: e,
          methodNames: n,
        },
      });
    });

  (this.request = (function () {
    var t = n(
      e().mark(function t(n) {
        var i, o, s, a, c;
        return e().wrap(function (t) {
          for (;;)
            switch ((t.prev = t.next)) {
              case 0:
                if (
                  ((i = n.method),
                  (o = n.params),
                  (s = void 0 === o ? {} : o),
                  ("signAndSendTransactions" !== i && "sendMoney" !== i) || senderWallet.accountId)
                ) {
                  t.next = 3;
                  break;
                }
                return t.abrupt("return", l);
              case 3:
                return (
                  (a = {
                    type: "sender-wallet-fromPage",
                    method: i,
                    params: s,
                  }),
                  (t.next = 6),
                  f(a)
                );
              case 6:
                if (!(c = t.sent).isUnlock) {
                  t.next = 11;
                  break;
                }
                return (t.next = 10), f(a);
              case 10:
                c = t.sent;
              case 11:
                return t.abrupt("return", c);
              case 12:
              case "end":
                return t.stop();
            }
        }, t);
      }),
    );
    return function (e) {
      return t.apply(this, arguments);
    };
  })()),
    (this.signAndSendTransaction = function (t) {
      var e = t.receiverId,
        n = t.actions;
      return senderWallet.request({
        method: "signAndSendTransactions",
        params: {
          transactions: [
            {
              receiverId: e,
              actions: n,
            },
          ],
        },
      });
    }),
    (this.requestSignTransactions = function (t) {
      var e = t.transactions;
      return senderWallet.request({
        method: "signAndSendTransactions",
        params: {
          transactions: e,
        },
      });
    }),
    (this.sendMoney = function (t) {
      var e = t.receiverId,
        n = t.amount;
      return senderWallet.request({
        method: "sendMoney",
        params: {
          receiverId: e,
          amount: n,
        },
      });
    }),
    (this.accountId = ""),
    (this.authData = u),
    (this.isSender = !0),
    (this.callbacks = {}),
    (this.__account = null);
})()),
  window.near.request({
    method: "persisSignInStatus",
    params: {},
  }),
  window.addEventListener("message", function (t) {
    try {
      var e = t.data;
      if ("sender-wallet-fromContent" === e.type) {
        var r = e.eventName;
        if (window.near.callbacks[r])
          switch (r) {
            case "accountChanged":
              y(),
                window.near.request({
                  method: "persisSignInStatus",
                  params: {},
                }),
                window.near.callbacks.accountChanged &&
                  window.near.callbacks.accountChanged(e.accountId);
              break;
            case "rpcChanged":
              y(),
                window.near.request({
                  method: "persisSignInStatus",
                  params: {},
                }),
                window.near.callbacks.rpcChanged && window.near.callbacks.rpcChanged(e.rpc);
              break;
            default:
              window.near.callbacks[r] && window.near.callbacks[r](e);
          }
      }
      if ("sender-wallet-extensionResult" === e.type || "sender-wallet-providerResult" === e.type)
        if ("disconnect" === e.method || "signout" === e.method) {
          var n = e.response,
            i = e.notificationId;
          if (n.error)
            c[i]({
              error: n.error,
            });
          else {
            var o = n.contractId,
              s = n.methodNames;
            c[i](!0),
              p({
                contractId: o,
                methodNames: s,
              });
          }
        } else if ("signin" === e.method || "persisSignInStatus" === e.method) {
          var a = e.accountId,
            u = e.contractId,
            h = e.response,
            l = e.allKeys,
            f = e.rpc,
            m = e.network,
            g = e.notificationId;
          if (h.error)
            c[g]({
              error: h.error,
            });
          else {
            var w = {};
            h &&
              h.accountId &&
              ((w = h.accessKey),
              (a = h.accountId),
              (u = h.contractId),
              (f = h.rpc),
              (m = h.network),
              (l = h.allKeys)),
              d({
                accountId: a,
                allKeys: l,
                accessKey: w,
                network: m,
                rpc: f,
              }),
              c[g]({
                accessKey: w,
              }),
              window.near.callbacks.signIn &&
                window.near.callbacks.signIn({
                  accountId: a,
                  accessKey: w,
                  contractId: u,
                  network: m,
                  rpc: f,
                });
          }
        } else
          "unlock" === e.method && "success" === e.response
            ? c[e.notificationId]({
                isUnlock: !0,
              })
            : c[e.notificationId](e);
    } catch (t) {}
  });
