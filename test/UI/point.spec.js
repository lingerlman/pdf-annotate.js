import { equal } from 'assert';
import simulant from 'simulant';
import PDFJSAnnotate from '../../src/PDFJSAnnotate';
import { enablePoint, disablePoint } from '../../src/UI/point';
import mockAddAnnotation from '../mockAddAnnotation';
import mockAddComment from '../mockAddComment';
import mockSVGContainer from '../mockSVGContainer';

let svg;
let addAnnotationSpy;
let addCommentSpy;
let __addComment = PDFJSAnnotate.StoreAdapter.addComment;
let __getComments = PDFJSAnnotate.StoreAdapter.getComments;
let __addAnnotation = PDFJSAnnotate.StoreAdapter.addAnnotation;
let __getAnnotations = PDFJSAnnotate.StoreAdapter.getAnnotations

function simulateCreatePointAnnotation(textContent) {
  let rect = svg.getBoundingClientRect();
  simulant.fire(svg, 'mouseup', {
    target: svg,
    clientX: rect.left + 10,
    clientY: rect.top + 10
  });

  setTimeout(function () {
    let input = document.getElementById('pdf-annotate-point-input');
    if (input) {
      input.focus();
      input.value = textContent;
      simulant.fire(input, 'blur');
    }
  });
}

describe('UI::point', function () {
  beforeEach(function () {
    svg = mockSVGContainer();
    svg.style.width = '100px';
    svg.style.height = '100px';
    document.body.appendChild(svg);

    addAnnotationSpy = sinon.spy();
    addCommentSpy = sinon.spy();
    PDFJSAnnotate.StoreAdapter.addComment = mockAddComment(addCommentSpy);
    PDFJSAnnotate.StoreAdapter.getComments = () => {
      return Promise.resolve([]);
    }
    PDFJSAnnotate.StoreAdapter.addAnnotation = mockAddAnnotation(addAnnotationSpy);
    PDFJSAnnotate.StoreAdapter.getAnnotations = (documentId, pageNumber) => {
      return Promise.resolve({
        documentId,
        pageNumber,
        annotations: []
      });
    }
  });

  afterEach(function () {
    let input = document.getElementById('pdf-annotate-point-input');
    if (input && input.parentNode) {
      input.parentNode.removeChild(input);
    }

    if (svg.parentNode) {
      svg.parentNode.removeChild(svg);
    }

    disablePoint();
  });

  after(function () {
    PDFJSAnnotate.StoreAdapter.addComment = __addComment;
    PDFJSAnnotate.StoreAdapter.getComments = __getComments;
    PDFJSAnnotate.StoreAdapter.addAnnotation = __addAnnotation;
    PDFJSAnnotate.StoreAdapter.getAnnotations = __getAnnotations;
  });

  it('should do nothing when disabled', function (done) {
    enablePoint();
    disablePoint();
    simulateCreatePointAnnotation('foo bar baz');
    setTimeout(function () {
      equal(addAnnotationSpy.called, false);
      equal(addCommentSpy.called, false);
      done();
    });
  });

  it('should create an annotation when enabled', function (done) {
    disablePoint();
    enablePoint();
    simulateCreatePointAnnotation('foo bar baz');
    setTimeout(function () {
      let addAnnotationArgs = addAnnotationSpy.getCall(0).args;
      let addCommentArgs = addCommentSpy.getCall(0).args;

      equal(addAnnotationSpy.called, true);
      equal(addCommentSpy.called, true);

      equal(addAnnotationArgs[0], 'test-document-id');
      equal(addAnnotationArgs[1], '1');
      equal(addAnnotationArgs[2].type, 'point');

      equal(addCommentArgs[0], 'test-document-id');
      equal(addCommentArgs[1], addAnnotationArgs[2].uuid);
      equal(addCommentArgs[2], 'foo bar baz');
      
      done();
    });
  });

});
