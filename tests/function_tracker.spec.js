const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const trackerFactory = require('../index');

chai.use(sinonChai);
chai.use(chaiAsPromised);
const expect = chai.expect;
chai.should();

function makeMockFunction(...values) {
  let i = 0;
  return () => {
    i++;
    return values[i-1];
  }
}

function makePromiseMockFunction(...values) {
  let i = 0;
  return () => {
    return new Promise((resolve, reject) => {
      i++;
      resolve(values[i-1]);
    });
  };
}

describe("function can tell the difference between changing return values", () => {
  it("returns which elements have left the array", (done) => {
    let elementLeaveMock = sinon.spy();
    let tracker = trackerFactory({
      watchFunction: makeMockFunction([1,2,3], [1,2])
    });

    tracker.on('element_left', elementLeaveMock);

    tracker.call();
    tracker.call();

    Promise.resolve().then(() => {
      elementLeaveMock.should.have.been.calledWith([3]);
      done();
    });
  });

  it("does not trigger the event when no elements leave", (done) => {
    let elementLeaveMock = sinon.spy();
    let tracker = trackerFactory({
      watchFunction: makeMockFunction([1,2,3], [1,3,2,4])
    });

    tracker.on('element_left', elementLeaveMock);

    tracker.call();
    tracker.call();

    Promise.resolve().then(() => {
      elementLeaveMock.should.have.not.been.called;
      done();
    });
  });

  it("triggers an event when elements join", (done) => {
    let elementJoinMock = sinon.spy();
    let tracker = trackerFactory({
      watchFunction: makeMockFunction([1,2], [1,2,3])
    });

    tracker.on('element_join', elementJoinMock);

    tracker.call();
    tracker.call();

    Promise.resolve().then(() => {
      elementJoinMock.should.have.been.calledWith([3]);
      done();
    });
  });

  it("does not trigger an event when elements don't join", (done) => {
    let elementJoinMock = sinon.spy();
    let tracker = trackerFactory({
      watchFunction: makeMockFunction([1,2,3], [1,2,3])
    });

    tracker.on('element_join', elementJoinMock);

    tracker.call();
    tracker.call();

    Promise.resolve().then(() => {
      elementJoinMock.should.have.not.been.called;
      done();
    });
  });

  it("triggers an element_join event with custom comparator", (done) => {
    let elementJoinMock = sinon.spy();
    let tracker = trackerFactory({
      watchFunction: makeMockFunction(
        [{id: 1, name: "a"}],
        [{id: 2, name: "b"}, {id: 1, name: "b"}])
    });

    tracker.on('element_join', elementJoinMock);
    tracker.setComparator((a,b) => {return a.id === b.id});

    tracker.call();
    tracker.call();

    Promise.resolve().then(() => {
      elementJoinMock.should.have.been.calledWith([{id: 2, name: "b"}])
      done();
    });
  });
});

describe("function can tell the difference between changing return promises", () => {
  it("returns which elements have left the array", (done) => {
    let elementLeaveMock = sinon.spy();
    let tracker = trackerFactory({
      watchFunction: makePromiseMockFunction([1,2,3], [1,2])
    });

    tracker.on('element_left', elementLeaveMock);

    tracker.call();
    tracker.call();

    Promise.resolve().then(() => {
      elementLeaveMock.should.have.been.calledWith([3]);
      done();
    });
  });

  it("does not trigger the event when no elements leave", (done) => {
    let elementLeaveMock = sinon.spy();
    let tracker = trackerFactory({
      watchFunction: makePromiseMockFunction([1,2,3], [1,3,2,4])
    });

    tracker.on('element_left', elementLeaveMock);

    tracker.call();
    tracker.call();

    Promise.resolve().then(() => {
      elementLeaveMock.should.have.not.been.called;
      done();
    });
  });

  it("triggers an event when elements join", (done) => {
    let elementJoinMock = sinon.spy();
    let tracker = trackerFactory({
      watchFunction: makePromiseMockFunction([1,2], [1,2,3])
    });

    tracker.on('element_join', elementJoinMock);

    tracker.call();
    tracker.call();

    Promise.resolve().then(() => {
      elementJoinMock.should.have.been.calledWith([3]);
      done();
    });
  });

  it("does not trigger an event when elements don't join", (done) => {
    let elementJoinMock = sinon.spy();
    let tracker = trackerFactory({
      watchFunction: makePromiseMockFunction([1,2,3], [1,2,3])
    });

    tracker.on('element_join', elementJoinMock);

    tracker.call();
    tracker.call();

    Promise.resolve().then(() => {
      elementJoinMock.should.have.not.been.called;
      done();
    });
  });

  it("triggers an element_join event with custom comparator", (done) => {
    let elementJoinMock = sinon.spy();
    let tracker = trackerFactory({
      watchFunction: makePromiseMockFunction(
        [{id: 1, name: "a"}],
        [{id: 2, name: "b"}, {id: 1, name: "b"}])
    });

    tracker.on('element_join', elementJoinMock);
    tracker.setComparator((a,b) => {return a.id === b.id});

    tracker.call();
    tracker.call();

    Promise.resolve().then(() => {
      elementJoinMock.should.have.been.calledWith([{id: 2, name: "b"}])
      done();
    });
  });
});

describe("full example with elements joining and leaving, initializing with chaining", () => {
  it('performs all functions at once', (done) => {
    let elementJoinMock = sinon.spy();
    let elementLeaveMock = sinon.spy();

    tracker = trackerFactory({
      watchFunction: makePromiseMockFunction(
        [{id: 1, name: "H"}, {id: 2, name: "G"}],
        [{id: 1, name: "I"}, {id: 3, name: "Y"}]
      )
    })
    .setComparator((a,b) => {return a.id === b.id})
    .on('element_join', elementJoinMock)
    .on('element_left', elementLeaveMock)

    tracker.call()
    tracker.call()

    Promise.resolve().then(() => {
      elementJoinMock.should.have.been.calledWith([{id: 3, name: "Y"}]);
      elementLeaveMock.should.have.been.calledWith([{id: 2, name: "G"}]);
      done();
    })
  })
})

describe("tests for bad input and rejection by the watched function", () => {
  it("handles a rejection by the watched function", () => {
    let tracker = trackerFactory({
      watchFunction: () => {
        return Promise.reject(new Error("random error"))
      }
    })

    return tracker.call().should.be.fulfilled;
  })
})
