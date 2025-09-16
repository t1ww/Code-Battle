// Example for sum question
#include <iostream>
using namespace std;

int sum(int a, int b) {
    return a + b;
}

int main() {
    int x, y;
    cin >> x >> y;
    cout << sum(x, y) << endl;
    return 0;
}

// Example with input
#include <iostream>
#include <string>
using namespace std;

int main() {
    string input;
    cout << "Enter something: ";
    getline(cin, input);
    cout << "You typed: " << input << endl;
    return 0;
}