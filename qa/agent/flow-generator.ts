import { Action } from './flow-agent';

export async function generateFlow(route: string): Promise<Action[]> {
  switch (route) {
    case '/':
      return [
        { type: 'goto', url: '/' },
        { type: 'wait', ms: 1000 },
        { type: 'click', selector: 'a:has-text("Rooms")' },
        { type: 'wait', ms: 1000 }
      ];

    case '/rooms':
      return [
        { type: 'goto', url: '/rooms' },
        { type: 'wait', ms: 1500 }
      ];

    case '/contact':
      return [
        { type: 'goto', url: '/contact' },
        { type: 'wait', ms: 1000 },
        { type: 'type', selector: 'input >> nth=0', value: 'QA AI Explorer User' },
        { type: 'type', selector: 'input >> nth=1', value: 'qa-explorer@smarthotel.com' },
        { type: 'type', selector: 'input >> nth=2', value: 'Inquiry regarding elite penthouse reservation' },
        { type: 'type', selector: 'textarea', value: 'This is an automated smoke validation inquiry sent from our Self-Healing QA Engine.' },
        { type: 'wait', ms: 1000 }
      ];

    default:
      return [
        { type: 'goto', url: route },
        { type: 'wait', ms: 1000 }
      ];
  }
}
