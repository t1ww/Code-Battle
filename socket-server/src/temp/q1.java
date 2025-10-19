// Write code here
import java.util.Scanner;
public class q1 {
    public static void main(String[] args) {
        Scanner scan = new Scanner(System.in);
        int n = scan.nextInt();
        if (n%2 == 0) {
            IO.print("Yes");
        } else {
            IO.print("No");
        }
        scan.close();
    }
}